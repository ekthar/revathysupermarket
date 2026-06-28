import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireOrderStaff } from "@/lib/authz";
import { sendPushToUser } from "@/lib/push";
import { deliveryAssignmentSchema } from "@/lib/validations";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";
import { createDeliveryOtp, deliveryOtpExpiryDate } from "@/lib/delivery";
import { sendDeliveryAlert } from "@/lib/delivery-alerts";
import { sendFcmToUser } from "@/lib/fcm-admin";
import { publishOrderAssigned } from "@/lib/realtime/event-publisher";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireOrderStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = deliveryAssignmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid delivery assignment." }, { status: 400 });

  // Ensure bill number is generated before allowing delivery assignment
  if (parsed.data.deliveryPartnerId) {
    const existing = await prisma.order.findUnique({ where: { id }, select: { billNumber: true } });
    if (!existing?.billNumber) {
      return NextResponse.json({ error: "Generate bill number first" }, { status: 400 });
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      deliveryPartnerId: parsed.data.deliveryPartnerId,
      deliveryAssignedAt: parsed.data.deliveryPartnerId ? new Date() : null,
      deliveryAlertAckAt: null,
      deliveryOtp: parsed.data.deliveryPartnerId ? createDeliveryOtp() : null,
      deliveryOtpAttempts: 0,
      deliveryOtpExpiresAt: parsed.data.deliveryPartnerId ? deliveryOtpExpiryDate() : null
    },
    select: { id: true, deliveryOtp: true, deliveryOtpExpiresAt: true, userId: true, orderNumber: true, phone: true, customerName: true, houseName: true, street: true, landmark: true, pincode: true, total: true }
  });
  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "delivery_assigned",
    targetType: "Order",
    targetId: id,
    metadata: { deliveryPartnerId: parsed.data.deliveryPartnerId }
  });
  if (parsed.data.deliveryPartnerId) {
    // Create AssignmentEvent for mobile app consumption
    const eventId = `assign-${id}-${parsed.data.deliveryPartnerId}-${Date.now()}`;
    await prisma.assignmentEvent.create({
      data: {
        eventId,
        orderId: id,
        partnerId: parsed.data.deliveryPartnerId,
        orderNumber: order.orderNumber,
        assignedAt: new Date(),
      },
    }).catch(() => null); // Non-blocking: don't fail if event already exists

    // Send FCM push notification to delivery partner's mobile devices
    sendFcmToUser(parsed.data.deliveryPartnerId, {
      type: "delivery_assignment",
      eventId,
      orderId: id,
      orderNumber: order.orderNumber,
    }).then(async (sent) => {
      if (sent) {
        await prisma.assignmentEvent.update({
          where: { eventId },
          data: { fcmSent: true, fcmSentAt: new Date() },
        }).catch(() => null);
      }
    }).catch(() => null); // Non-blocking

    // Send real-time SSE alert to the delivery partner (instant in-app alert with sound + vibration)
    sendDeliveryAlert(parsed.data.deliveryPartnerId, {
      type: "new_order",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        address: `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
        total: Number(order.total)
      }
    });

    // Send push notification as fallback (for when app is in background)
    await sendPushToUser(parsed.data.deliveryPartnerId, {
      title: "🚀 New Order Assigned!",
      body: `Order #${order.orderNumber} for ${order.customerName}. Open app to view details.`,
      url: "/delivery",
      orderId: id,
      requireInteraction: true
    });

    await sendWhatsAppTemplate({
      to: order.phone,
      template: "delivery_assigned",
      params: [order.orderNumber, order.deliveryOtp ?? ""],
      orderId: order.id
    });
    await sendPushToUser(order.userId, {
      title: "Delivery partner assigned",
      body: `Order #${order.orderNumber} is ready for delivery. Your OTP is ${order.deliveryOtp}.`,
      url: "/dashboard",
      orderId: id
    });

    // ─── PUBLISH REAL-TIME EVENT ───
    publishOrderAssigned({
      orderId: id,
      orderNumber: order.orderNumber,
      riderId: parsed.data.deliveryPartnerId,
      customerName: order.customerName,
      address: `${order.houseName}, ${order.street}, ${order.landmark}, ${order.pincode}`,
      total: Number(order.total),
      userId: order.userId,
    }).catch(() => null); // Fire-and-forget
  }

  return NextResponse.json({ order });
}
