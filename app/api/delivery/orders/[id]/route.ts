import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { isDeliveryRole } from "@/lib/authz";
import { sendPushToUser } from "@/lib/push";
import { deliveryActionSchema } from "@/lib/validations";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !isDeliveryRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = deliveryActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid delivery action." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id }, select: { id: true, deliveryPartnerId: true, deliveryOtp: true, userId: true, orderNumber: true, phone: true } });
  if (!order || order.deliveryPartnerId !== session.user.id) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (parsed.data.action === "delivered" && parsed.data.otp !== order.deliveryOtp) {
    return NextResponse.json({ error: "Delivery OTP is incorrect." }, { status: 400 });
  }

  const nextStatus = parsed.data.action === "picked_up" ? "OUT_FOR_DELIVERY" : "DELIVERED";
  await prisma.order.update({
    where: { id },
    data: {
      status: nextStatus,
      deliveryConfirmedAt: parsed.data.action === "delivered" ? new Date() : undefined,
      paymentStatus: parsed.data.action === "delivered" ? "PAID" : undefined,
      statusEvents: { create: { status: nextStatus, note: `Marked ${parsed.data.action} by delivery partner.` } }
    }
  });
  await sendWhatsAppTemplate({
    to: order.phone,
    template: parsed.data.action === "picked_up" ? "out_for_delivery" : "delivered",
    params: parsed.data.action === "picked_up" ? [order.orderNumber, order.deliveryOtp ?? ""] : [order.orderNumber],
    orderId: order.id
  });
  await writeAuditLog({
    actorId: session.user.id,
    actorRole: session.user.role,
    action: parsed.data.action === "picked_up" ? "delivery_picked_up" : "delivery_delivered",
    targetType: "Order",
    targetId: id
  });
  await sendPushToUser(order.userId, {
    title: parsed.data.action === "picked_up" ? "Order picked up" : "Order delivered",
    body: parsed.data.action === "picked_up" ? `Order #${order.orderNumber} is on the way.` : `Order #${order.orderNumber} was delivered.`,
    url: "/dashboard",
    orderId: id
  });

  return NextResponse.json({ ok: true });
}
