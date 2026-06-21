import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requirePackingStaff } from "@/lib/authz";
import { sendPushToUser } from "@/lib/push";
import { orderStatusSchema } from "@/lib/validations";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-business";
import { notifyOrderStatus } from "@/lib/notifications";
import { awardDeliveredOrderBenefits, releaseCancelledOrderReservations } from "@/lib/loyalty";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requirePackingStaff(session);
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const body = await request.json();
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  if (session?.user?.role === "PACKING_STAFF" && !["ACCEPTED", "PACKING", "READY_FOR_DELIVERY"].includes(parsed.data.status)) {
    return NextResponse.json({ error: "Packing staff cannot apply this order status.", code: "FORBIDDEN_STATUS" }, { status: 403 });
  }

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
      staffNote: parsed.data.staffNote,
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
    // Restore inventory on cancellation
    if (parsed.data.status === "CANCELLED") {
      await releaseCancelledOrderReservations(id);
    }

    // Send in-app notification
    if (before.userId) {
      await notifyOrderStatus(before.userId, before.orderNumber, parsed.data.status, id).catch(() => null);
    }

    if (parsed.data.status === "READY_FOR_DELIVERY") {
      await sendWhatsAppTemplate({ to: before.phone, template: "order_packed", params: [before.orderNumber], orderId: id });
    }
    if (parsed.data.status === "OUT_FOR_DELIVERY") {
      await sendWhatsAppTemplate({ to: before.phone, template: "out_for_delivery", params: [before.orderNumber, before.deliveryOtp ?? ""], orderId: id });
    }
    if (parsed.data.status === "DELIVERED") {
      await awardDeliveredOrderBenefits(id);
      await sendWhatsAppTemplate({ to: before.phone, template: "delivered", params: [before.orderNumber], orderId: id });
    }
  }
  return NextResponse.json({ order });
}
