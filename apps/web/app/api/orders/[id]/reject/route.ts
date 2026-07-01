import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { sendFcmToAdmins } from "@/lib/fcm-admin";
import { z } from "zod";

const rejectSchema = z.object({
  reason: z.string().max(500).optional(),
});

/**
 * POST /api/orders/[id]/reject — Staff/delivery partner rejects an assigned order.
 * Unassigns the partner, resets status to READY_FOR_DELIVERY, and sends
 * a high-priority push notification to all admin device tokens.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  const result = await requireRole(["STAFF", "DELIVERY_PARTNER"]);
  if (result instanceof NextResponse) return result;
  const session = result;

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
  if (order.deliveryPartnerId !== session.user.id) {
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
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "order_rejected",
        targetType: "Order",
        targetId: orderId,
        metadata: { reason: reason || null, orderNumber: order.orderNumber },
      },
    }),
  ]);

  // Send high-priority FCM to all admin devices (fire-and-forget)
  sendFcmToAdmins({
    type: "order_rejected",
    eventId: `reject-${orderId}-${Date.now()}`,
    orderId,
    orderNumber: order.orderNumber,
    deepLink: `msmsupermarket://admin/orders/${orderId}`,
  }).catch((err) => {
    console.error("[FCM] Failed to notify admins of rejection:", err);
  });

  return NextResponse.json({
    ok: true,
    orderId,
    status: "READY_FOR_DELIVERY",
  });
}
