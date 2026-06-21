import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";

/**
 * PATCH /api/admin/returns/[id]
 * Update return status through the workflow:
 * REQUESTED → UNDER_REVIEW → APPROVED → ITEM_RECEIVED → REFUNDED
 * REJECTED is a terminal state from REQUESTED or UNDER_REVIEW.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { action, reason, refundAmount, refundMethod } = body as {
    action: "review" | "approve" | "reject" | "receive_item" | "refund";
    reason?: string;
    refundAmount?: number;
    refundMethod?: string;
  };

  // Different permissions for different actions
  if (action === "refund") {
    const result = await requirePermission("returns.refund");
    if ("error" in result) return result.error;
  } else {
    const result = await requirePermission("returns.manage");
    if ("error" in result) return result.error;
  }

  const ctx = (await requirePermission("returns.manage") as any).ctx;

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: params.id },
    include: { order: { select: { total: true, userId: true, items: true } } },
  });

  if (!returnReq) {
    return NextResponse.json({ error: "Return not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const now = new Date();

  switch (action) {
    case "review":
      if (returnReq.status !== "REQUESTED") {
        return NextResponse.json({ error: "Can only review from REQUESTED status", code: "INVALID_STATE" }, { status: 400 });
      }
      await prisma.returnRequest.update({ where: { id: params.id }, data: { status: "UNDER_REVIEW", resolvedById: ctx.userId } });
      break;

    case "approve":
      if (!["REQUESTED", "UNDER_REVIEW"].includes(returnReq.status)) {
        return NextResponse.json({ error: "Can only approve from REQUESTED/UNDER_REVIEW", code: "INVALID_STATE" }, { status: 400 });
      }
      // Calculate max refund from order item snapshot
      const items = returnReq.items as any[];
      const maxRefund = items.reduce((sum: number, i: any) => sum + (Number(i.price) * (i.quantity || 1)), 0);
      await prisma.returnRequest.update({
        where: { id: params.id },
        data: { status: "APPROVED", maxRefundAmount: maxRefund, resolvedById: ctx.userId, resolvedAt: now },
      });
      break;

    case "reject":
      if (!["REQUESTED", "UNDER_REVIEW"].includes(returnReq.status)) {
        return NextResponse.json({ error: "Can only reject from REQUESTED/UNDER_REVIEW", code: "INVALID_STATE" }, { status: 400 });
      }
      if (!reason) {
        return NextResponse.json({ error: "Rejection reason is required", code: "VALIDATION_ERROR" }, { status: 400 });
      }
      await prisma.returnRequest.update({
        where: { id: params.id },
        data: { status: "REJECTED", rejectionReason: reason, resolvedById: ctx.userId, resolvedAt: now },
      });
      break;

    case "receive_item":
      if (returnReq.status !== "APPROVED") {
        return NextResponse.json({ error: "Can only receive item after approval", code: "INVALID_STATE" }, { status: 400 });
      }
      await prisma.returnRequest.update({
        where: { id: params.id },
        data: { status: "ITEM_RECEIVED", itemReceivedAt: now },
      });
      break;

    case "refund":
      if (!["APPROVED", "ITEM_RECEIVED"].includes(returnReq.status)) {
        return NextResponse.json({ error: "Can only refund after approval/item receipt", code: "INVALID_STATE" }, { status: 400 });
      }
      if (!refundAmount || refundAmount <= 0) {
        return NextResponse.json({ error: "Valid refund amount required", code: "VALIDATION_ERROR" }, { status: 400 });
      }
      if (returnReq.maxRefundAmount && refundAmount > Number(returnReq.maxRefundAmount)) {
        if (!reason) {
          return NextResponse.json({ error: "Reason required for refund exceeding max", code: "VALIDATION_ERROR" }, { status: 400 });
        }
      }

      // Process refund transactionally
      await prisma.$transaction(async (tx) => {
        await tx.returnRequest.update({
          where: { id: params.id },
          data: {
            status: "REFUNDED",
            refundAmount,
            refundMethod: (refundMethod as any) || "WALLET",
            refundedAt: now,
            resolutionNote: reason || `Refund of ₹${refundAmount} processed`,
          },
        });

        // Credit wallet if refund method is wallet
        if (!refundMethod || refundMethod === "WALLET") {
          if (returnReq.order.userId) {
            await tx.walletTransaction.create({
              data: {
                userId: returnReq.order.userId,
                orderId: returnReq.orderId,
                amount: refundAmount,
                type: "credit",
                reason: `Refund for return ${returnReq.returnNumber}`,
              },
            });
          }
        }

        // Update order payment status
        await tx.order.update({
          where: { id: returnReq.orderId },
          data: { paymentStatus: refundAmount >= Number(returnReq.order.total) ? "REFUNDED" : "PARTIALLY_REFUNDED" },
        });
      });
      break;

    default:
      return NextResponse.json({ error: "Invalid action", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Audit
  await prisma.auditLog.create({
    data: {
      actorId: ctx.userId,
      actorRole: ctx.role,
      action: `return.${action}`,
      targetType: "ReturnRequest",
      targetId: params.id,
      metadata: { action, reason, refundAmount },
    },
  });

  const updated = await prisma.returnRequest.findUnique({ where: { id: params.id } });
  return NextResponse.json({ returnRequest: updated });
}
