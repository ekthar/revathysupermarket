import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const rejectSchema = z.object({
  reason: z.string().max(500).optional(),
});

/**
 * POST /api/mobile/v1/orders/[id]/reject
 * Delivery partner rejects an assigned order.
 * Unassigns the partner, resets status to READY_FOR_DELIVERY, creates OrderEvent and AuditLog.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DELIVERY_PARTNER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse optional reason
  const body = await request.json().catch(() => ({}));
  const parsed = rejectSchema.safeParse(body);
  const reason = parsed.success ? parsed.data.reason : undefined;

  // Fetch the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      deliveryPartnerId: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Verify the current user is the assigned delivery partner
  if (order.deliveryPartnerId !== auth.userId) {
    return NextResponse.json(
      { error: "Not assigned to this order" },
      { status: 403 }
    );
  }

  // Only allow rejection in valid statuses
  const rejectableStatuses = ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"];
  if (!rejectableStatuses.includes(order.status)) {
    return NextResponse.json(
      { error: "Order not in a rejectable status" },
      { status: 409 }
    );
  }

  // Transaction: unassign partner, reset status, log event + audit
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryPartnerId: null,
        deliveryAssignedAt: null,
        deliveryAlertAckAt: null,
        status: "READY_FOR_DELIVERY",
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId,
        status: "READY_FOR_DELIVERY",
        note: `Rejected by delivery partner: ${reason || "No reason provided"}`,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: auth.userId,
        actorRole: auth.role,
        action: "order_rejected",
        targetType: "Order",
        targetId: orderId,
        metadata: { reason: reason || null, orderNumber: order.orderNumber },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    orderId,
    status: "READY_FOR_DELIVERY",
  });
}
