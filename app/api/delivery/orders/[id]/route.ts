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

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      deliveryPartnerId: true,
      deliveryOtp: true,
      deliveryOtpAttempts: true,
      deliveryOtpExpiresAt: true,
      userId: true,
      orderNumber: true,
      phone: true
    }
  });
  if (!order || order.deliveryPartnerId !== session.user.id) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (parsed.data.action === "request_cancel") {
    // Save a staff note with the cancellation reason from the delivery partner
    const reason = parsed.data.reason || "Delivery partner requested cancellation";
    const existingNote = await prisma.order.findUnique({ where: { id }, select: { staffNote: true } });
    const newNote = [existingNote?.staffNote, `[DELIVERY CANCEL REQUEST] ${reason}`].filter(Boolean).join("\n");
    await prisma.order.update({
      where: { id },
      data: {
        staffNote: newNote,
        statusEvents: { create: { status: order.deliveryPartnerId ? "READY_FOR_DELIVERY" : "ORDER_RECEIVED", note: `Delivery partner requested cancellation: ${reason}` } }
      }
    });
    await writeAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "delivery_cancel_requested",
      targetType: "Order",
      targetId: id,
      metadata: { reason }
    });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "delivered") {
    if (order.deliveryOtpExpiresAt && order.deliveryOtpExpiresAt < new Date()) {
      return NextResponse.json({ error: "Delivery OTP has expired. Ask admin to regenerate it." }, { status: 400 });
    }
    if (order.deliveryOtpAttempts >= 3) {
      return NextResponse.json({ error: "Too many wrong OTP attempts. Ask admin to regenerate it." }, { status: 400 });
    }
    if (parsed.data.otp !== order.deliveryOtp) {
      await prisma.order.update({
        where: { id },
        data: { deliveryOtpAttempts: { increment: 1 } }
      });
      return NextResponse.json({ error: "Delivery OTP is incorrect." }, { status: 400 });
    }
  }

  const nextStatus = parsed.data.action === "picked_up" ? "OUT_FOR_DELIVERY" : "DELIVERED";
  await prisma.order.update({
    where: { id },
    data: {
      status: nextStatus,
      deliveryConfirmedAt: parsed.data.action === "delivered" ? new Date() : undefined,
      paymentStatus: parsed.data.action === "delivered" ? "PAID" : undefined,
      deliveryOtpAttempts: parsed.data.action === "delivered" ? 0 : undefined,
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
