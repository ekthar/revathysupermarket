import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * POST /api/mobile/v1/admin/orders/[id]/assign
 * Assign a delivery partner to an order.
 * Sets deliveryPartnerId, deliveryAssignedAt, generates a 6-digit OTP,
 * creates AssignmentEvent and OrderEvent.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { deliveryPartnerId } = body as { deliveryPartnerId?: string };

  if (!deliveryPartnerId) {
    return NextResponse.json({ error: "deliveryPartnerId is required" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, billNumber: true, deliveryPartnerId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Generate 6-digit OTP
  const deliveryOtp = String(Math.floor(100000 + Math.random() * 900000));
  const deliveryOtpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const order = await prisma.order.update({
    where: { id },
    data: {
      deliveryPartnerId,
      deliveryAssignedAt: new Date(),
      deliveryAlertAckAt: null,
      deliveryOtp,
      deliveryOtpAttempts: 0,
      deliveryOtpExpiresAt,
      statusEvents: {
        create: {
          status: "READY_FOR_DELIVERY",
          note: "Delivery partner assigned.",
        },
      },
    },
    select: {
      id: true,
      orderNumber: true,
      deliveryPartnerId: true,
      deliveryAssignedAt: true,
      deliveryOtp: true,
      deliveryOtpExpiresAt: true,
    },
  });

  // Create AssignmentEvent
  const eventId = crypto.randomUUID();
  await prisma.assignmentEvent.create({
    data: {
      eventId,
      orderId: id,
      partnerId: deliveryPartnerId,
      orderNumber: order.orderNumber,
      assignedAt: new Date(),
    },
  }).catch(() => null); // Non-blocking

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      actorRole: auth.role,
      action: "delivery_assigned",
      targetType: "Order",
      targetId: id,
      metadata: { deliveryPartnerId },
    },
  });

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      deliveryPartnerId: order.deliveryPartnerId,
      deliveryAssignedAt: order.deliveryAssignedAt?.toISOString() ?? null,
      deliveryOtp: order.deliveryOtp,
      deliveryOtpExpiresAt: order.deliveryOtpExpiresAt?.toISOString() ?? null,
    },
  });
}
