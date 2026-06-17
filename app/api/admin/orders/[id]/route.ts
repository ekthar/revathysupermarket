import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireOrderStaff } from "@/lib/authz";
import { sendPushToUser } from "@/lib/push";
import { orderStatusSchema } from "@/lib/validations";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireOrderStaff(session);
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const body = await request.json();
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const before = await prisma.order.findUnique({
    where: { id },
    select: { status: true, userId: true, orderNumber: true, acknowledgedAt: true, phone: true, deliveryOtp: true }
  });
  if (parsed.data.status === "ACCEPTED" && !before?.acknowledgedAt) {
    return NextResponse.json({ error: "Start stock review first. Verify rack stock and make item changes before marking Stock OK." }, { status: 400 });
  }
  const order = await prisma.order.update({
    where: { id },
    data: {
      status: parsed.data.status,
      paymentStatus: parsed.data.status === "DELIVERED" ? "PAID" : undefined,
      deliveryConfirmedAt: parsed.data.status === "DELIVERED" ? new Date() : undefined,
      statusEvents: { create: { status: parsed.data.status, note: "Updated by staff." } }
    }
  });
  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "order_status_updated",
    targetType: "Order",
    targetId: id,
    metadata: { from: before?.status, to: parsed.data.status }
  });
  await sendPushToUser(before?.userId, {
    title: "Order status updated",
    body: `Order #${before?.orderNumber ?? ""} is now ${parsed.data.status.replaceAll("_", " ").toLowerCase()}.`,
    url: "/dashboard",
    orderId: id
  });
  if (before && before.status !== parsed.data.status) {
    if (parsed.data.status === "READY_FOR_DELIVERY") {
      await sendWhatsAppTemplate({ to: before.phone, template: "order_packed", params: [before.orderNumber], orderId: id });
    }
    if (parsed.data.status === "OUT_FOR_DELIVERY") {
      await sendWhatsAppTemplate({ to: before.phone, template: "out_for_delivery", params: [before.orderNumber, before.deliveryOtp ?? ""], orderId: id });
    }
    if (parsed.data.status === "DELIVERED") {
      await sendWhatsAppTemplate({ to: before.phone, template: "delivered", params: [before.orderNumber], orderId: id });
    }
  }
  return NextResponse.json({ order });
}
