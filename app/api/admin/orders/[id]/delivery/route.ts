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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireOrderStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = deliveryAssignmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid delivery assignment." }, { status: 400 });

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
  }

  return NextResponse.json({ order });
}
