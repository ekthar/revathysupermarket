import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/returns
 * Returns list of return requests with order info. Supports status filter.
 *
 * PATCH /api/mobile/v1/admin/returns
 * Approve or reject a return request.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  const returns = await prisma.returnRequest.findMany({
    where,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          phone: true,
          total: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    returns: returns.map((r) => ({
      id: r.id,
      returnNumber: r.returnNumber,
      orderId: r.orderId,
      billNumber: r.billNumber,
      items: r.items,
      reason: r.reason,
      photoUrl: r.photoUrl,
      evidenceUrls: r.evidenceUrls,
      note: r.note,
      status: r.status,
      refundMethod: r.refundMethod,
      refundAmount: r.refundAmount ? Number(r.refundAmount) : null,
      maxRefundAmount: r.maxRefundAmount ? Number(r.maxRefundAmount) : null,
      resolutionNote: r.resolutionNote,
      rejectionReason: r.rejectionReason,
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      order: {
        id: r.order.id,
        orderNumber: r.order.orderNumber,
        customerName: r.order.customerName,
        phone: r.order.phone,
        total: Number(r.order.total),
      },
    })),
  });
}

export async function PATCH(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, action, refundAmount, resolutionNote, rejectionReason } = body as {
    id?: string;
    action?: string;
    refundAmount?: number;
    resolutionNote?: string;
    rejectionReason?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const existing = await prisma.returnRequest.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Return request not found" }, { status: 404 });
  }

  if (action === "approve") {
    const updated = await prisma.returnRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        refundAmount: refundAmount ?? undefined,
        resolutionNote: resolutionNote ?? undefined,
        resolvedById: auth.userId,
        resolvedAt: new Date(),
      },
      select: { id: true, status: true, refundAmount: true, resolvedAt: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.userId,
        actorRole: auth.role,
        action: "return_approved",
        targetType: "ReturnRequest",
        targetId: id,
        metadata: { refundAmount },
      },
    });

    return NextResponse.json({
      returnRequest: {
        id: updated.id,
        status: updated.status,
        refundAmount: updated.refundAmount ? Number(updated.refundAmount) : null,
        resolvedAt: updated.resolvedAt?.toISOString() ?? null,
      },
    });
  } else {
    const updated = await prisma.returnRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason ?? undefined,
        resolutionNote: resolutionNote ?? undefined,
        resolvedById: auth.userId,
        resolvedAt: new Date(),
      },
      select: { id: true, status: true, rejectionReason: true, resolvedAt: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.userId,
        actorRole: auth.role,
        action: "return_rejected",
        targetType: "ReturnRequest",
        targetId: id,
        metadata: { rejectionReason },
      },
    });

    return NextResponse.json({
      returnRequest: {
        id: updated.id,
        status: updated.status,
        rejectionReason: updated.rejectionReason,
        resolvedAt: updated.resolvedAt?.toISOString() ?? null,
      },
    });
  }
}
