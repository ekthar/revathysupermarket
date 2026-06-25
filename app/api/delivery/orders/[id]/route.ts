import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { sendPushToUser } from "@/lib/push";
import { deliveryActionSchema } from "@/lib/validations";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";
import { authenticateDeliveryRequest } from "@/lib/hybrid-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateDeliveryRequest(request);
  if (!authResult) {
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
  if (!order || order.deliveryPartnerId !== authResult.userId) return NextResponse.json({ error: "Order not found." }, { status: 404 });

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
      actorId: authResult.userId,
      actorRole: authResult.role,
      action: "delivery_cancel_requested",
      targetType: "Order",
      targetId: id,
      metadata: { reason }
    });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "delivered") {
    return NextResponse.json({ error: "Use the collection and slide-to-deliver workflow.", code: "DELIVERY_COMPLETION_REQUIRED" }, { status: 409 });
  }

  const nextStatus = "OUT_FOR_DELIVERY";
  await prisma.order.update({
    where: { id },
    data: {
      status: nextStatus,
      statusEvents: { create: { status: nextStatus, note: `Marked ${parsed.data.action} by delivery partner.` } }
    }
  });
  await sendWhatsAppTemplate({
    to: order.phone,
    template: "out_for_delivery",
    params: [order.orderNumber, order.deliveryOtp ?? ""],
    orderId: order.id
  });
  await writeAuditLog({
    actorId: authResult.userId,
    actorRole: authResult.role,
    action: "delivery_picked_up",
    targetType: "Order",
    targetId: id
  });
  await sendPushToUser(order.userId, {
    title: "Order picked up",
    body: `Order #${order.orderNumber} is on the way.`,
    url: "/dashboard",
    orderId: id
  });

  return NextResponse.json({ ok: true });
}
