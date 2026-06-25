import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";

const schema = z.object({
  action: z.enum(["review", "approve", "reject", "receive_item", "refund"]).optional(),
  status: z.enum(["APPROVED", "REJECTED", "REFUNDED"]).optional(),
  reason: z.string().trim().max(500).optional(),
  resolutionNote: z.string().trim().max(500).optional(),
  refundAmount: z.coerce.number().positive().optional(),
  refundMethod: z.enum(["CASH", "UPI", "GATEWAY", "WALLET"]).optional(),
  refundReference: z.string().trim().max(120).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid return update.", code: "INVALID_RETURN_UPDATE", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const legacyAction = parsed.data.status === "APPROVED" ? "approve" : parsed.data.status === "REJECTED" ? "reject" : parsed.data.status === "REFUNDED" ? "refund" : undefined;
  const action = parsed.data.action ?? legacyAction;
  if (!action) return NextResponse.json({ error: "Return action is required.", code: "ACTION_REQUIRED" }, { status: 400 });

  const permission = await requirePermission(action === "refund" ? "returns.refund" : "returns.manage");
  if ("error" in permission) return permission.error;
  const limit = await enforceRateLimit(`admin:return:${permission.ctx.userId}`, 30, 300);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const { id } = await params;
  const reason = parsed.data.reason ?? parsed.data.resolutionNote;

  const current = await prisma.returnRequest.findUnique({ where: { id }, include: { order: { select: { id: true, total: true, userId: true, phone: true, orderNumber: true } } } });
  if (!current) return NextResponse.json({ error: "Return not found.", code: "RETURN_NOT_FOUND" }, { status: 404 });

  const transitions: Record<typeof action, { from: string[]; to: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ITEM_RECEIVED" | "REFUNDED" }> = {
    review: { from: ["REQUESTED"], to: "UNDER_REVIEW" },
    approve: { from: ["REQUESTED", "UNDER_REVIEW"], to: "APPROVED" },
    reject: { from: ["REQUESTED", "UNDER_REVIEW"], to: "REJECTED" },
    receive_item: { from: ["APPROVED"], to: "ITEM_RECEIVED" },
    refund: { from: ["APPROVED", "ITEM_RECEIVED"], to: "REFUNDED" }
  };
  const transition = transitions[action];
  if (!transition.from.includes(current.status)) {
    if (action === "refund" && current.status === "REFUNDED") return NextResponse.json({ returnRequest: current, idempotent: true });
    return NextResponse.json({ error: `Cannot ${action.replace("_", " ")} a ${current.status.toLowerCase()} return.`, code: "INVALID_RETURN_STATE" }, { status: 409 });
  }
  if (action === "reject" && !reason) return NextResponse.json({ error: "Rejection reason is required.", code: "REASON_REQUIRED" }, { status: 400 });

  const now = new Date();
  const amount = parsed.data.refundAmount ?? Number(current.maxRefundAmount ?? current.refundAmount ?? 0);
  if (action === "refund" && (amount <= 0 || amount > Number(current.maxRefundAmount ?? 0))) {
    return NextResponse.json({ error: "Refund amount exceeds the verified refundable amount.", code: "INVALID_REFUND_AMOUNT" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.returnRequest.updateMany({ where: { id, status: { in: transition.from as never[] } }, data: {
      status: transition.to,
      resolvedById: permission.ctx.userId,
      resolvedAt: ["APPROVED", "REJECTED", "REFUNDED"].includes(transition.to) ? now : undefined,
      itemReceivedAt: transition.to === "ITEM_RECEIVED" ? now : undefined,
      refundedAt: transition.to === "REFUNDED" ? now : undefined,
      rejectionReason: transition.to === "REJECTED" ? reason : undefined,
      resolutionNote: reason,
      refundAmount: transition.to === "REFUNDED" ? amount : undefined,
      refundMethod: transition.to === "REFUNDED" ? (parsed.data.refundMethod ?? "WALLET") : undefined,
      refundReference: transition.to === "REFUNDED" ? parsed.data.refundReference : undefined
    } });
    if (claimed.count !== 1) throw new Error("RETURN_ALREADY_UPDATED");

    if (transition.to === "REFUNDED") {
      if ((parsed.data.refundMethod ?? "WALLET") === "WALLET" && current.order.userId) {
        await tx.walletTransaction.create({ data: { userId: current.order.userId, orderId: current.order.id, returnRequestId: id, amount, type: "credit", reason: `Refund for return ${current.returnNumber}` } });
      }
      const totals = await tx.returnRequest.aggregate({ where: { orderId: current.order.id, status: "REFUNDED" }, _sum: { refundAmount: true } });
      await tx.order.update({ where: { id: current.order.id }, data: { paymentStatus: Number(totals._sum.refundAmount ?? 0) >= Number(current.order.total) ? "REFUNDED" : "PARTIALLY_REFUNDED" } });

      // Increment stock for returned items (batch lookup to avoid N+1)
      const returnItems = Array.isArray(current.items) ? current.items as Array<{ orderItemId?: string; name?: string; quantity?: number; price?: number; amount?: number }> : [];
      const validReturnItems = returnItems.filter((ri) => ri.orderItemId && ri.quantity);
      const orderItemIds = validReturnItems.map((ri) => ri.orderItemId!);
      const orderItems = orderItemIds.length > 0
        ? await tx.orderItem.findMany({ where: { id: { in: orderItemIds } }, select: { id: true, productId: true } })
        : [];
      const orderItemProductMap = new Map(orderItems.map((oi) => [oi.id, oi.productId]));
      for (const returnItem of validReturnItems) {
        const productId = orderItemProductMap.get(returnItem.orderItemId!);
        if (productId) {
          await tx.product.update({ where: { id: productId }, data: { stock: { increment: returnItem.quantity! } } });
        }
      }
    }
    await tx.auditLog.create({ data: { actorId: permission.ctx.userId, actorRole: permission.ctx.role as never, action: `return.${action}`, targetType: "ReturnRequest", targetId: id, metadata: { reason, amount: transition.to === "REFUNDED" ? amount : undefined } } });
    return tx.returnRequest.findUniqueOrThrow({ where: { id } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  if (["APPROVED", "REFUNDED"].includes(updated.status)) {
    await sendWhatsAppTemplate({ to: current.order.phone, template: "return_approved", params: [current.order.orderNumber, Number(updated.refundAmount ?? updated.maxRefundAmount ?? 0).toFixed(2), updated.refundMethod ?? "WALLET"], orderId: current.order.id }).catch(() => null);
  }
  return NextResponse.json({ returnRequest: updated });
}
