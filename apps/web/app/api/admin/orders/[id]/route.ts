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
import { publishOrderStatusChanged } from "@/lib/realtime/event-publisher";
import { sendFcmToUser } from "@/lib/fcm-admin";

const VALID_TRANSITIONS: Record<string, string[]> = {
  ORDER_RECEIVED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PACKING", "CANCELLED"],
  PACKING: ["READY_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_DELIVERY: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["ARRIVING", "CANCELLED"],
  ARRIVING: ["DELIVERED", "CANCELLED"],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requirePackingStaff(session);
  if (unauthorized) return unauthorized;
  const { id } = await params;

  const body = await request.json();
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  if (parsed.data.status === "DELIVERED") return NextResponse.json({ error: "Delivery must be completed by the assigned partner using OTP and a balanced collection.", code: "DELIVERY_COMPLETION_REQUIRED" }, { status: 409 });
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

  // Validate status transition
  if (before?.status && before.status in VALID_TRANSITIONS) {
    const allowed = VALID_TRANSITIONS[before.status];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${before.status} to ${parsed.data.status}.` },
        { status: 400 }
      );
    }
  }

  // Optimistic locking: only update if status hasn't changed since we read it
  const updateResult = await prisma.order.updateMany({
    where: { id, status: before?.status },
    data: {
      status: parsed.data.status,
      staffNote: parsed.data.staffNote,
    }
  });
  if (updateResult.count === 0) {
    return NextResponse.json(
      { error: "Order was modified by another user. Please refresh and try again." },
      { status: 409 }
    );
  }
  // Create status event separately (updateMany doesn't support nested creates)
  await prisma.orderEvent.create({
    data: { orderId: id, status: parsed.data.status, note: "Updated by staff." }
  });
  const order = await prisma.order.findUnique({ where: { id } });

  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "order_status_updated",
    targetType: "Order",
    targetId: id,
    metadata: { from: before?.status, to: parsed.data.status }
  }).catch(() => null);
  if (before && before.status !== parsed.data.status) {
    // Push notification to customer
    await sendPushToUser(before?.userId, {
      title: "Order status updated",
      body: `Order #${before?.orderNumber ?? ""} is now ${parsed.data.status.replaceAll("_", " ").toLowerCase()}.`,
      url: "/dashboard",
      orderId: id
    });

    // Restore inventory on cancellation
    if (parsed.data.status === "CANCELLED") {
      await releaseCancelledOrderReservations(id);
    }

    if (parsed.data.status === "PACKING") {
      const packingStaff = await prisma.user.findMany({
        where: { role: "PACKING_STAFF", isActive: true },
        select: { id: true }
      }).catch(() => []);
      for (const staff of packingStaff) {
        sendFcmToUser(staff.id, {
          type: "packing_assignment",
          eventId: `pack-${id}-${Date.now()}`,
          orderId: id,
          orderNumber: before?.orderNumber ?? "",
        }).catch(() => null);
      }
    }

    // Send in-app notification
    if (before.userId) {
      await notifyOrderStatus(before.userId, before.orderNumber, parsed.data.status, id).catch(() => null);
    }

    if (parsed.data.status === "READY_FOR_DELIVERY") {
      await sendWhatsAppTemplate({ to: before.phone, template: "order_packed", params: [before.orderNumber], orderId: id }).catch(() => null);
    }
    if (parsed.data.status === "OUT_FOR_DELIVERY") {
      await sendWhatsAppTemplate({ to: before.phone, template: "out_for_delivery", params: [before.orderNumber, before.deliveryOtp ?? ""], orderId: id }).catch(() => null);
    }
  }
  // ─── PUBLISH REAL-TIME EVENT ───
  publishOrderStatusChanged({
    orderId: id,
    orderNumber: before?.orderNumber ?? "",
    status: parsed.data.status,
    previousStatus: before?.status,
    userId: before?.userId,
  }).catch(() => null); // Fire-and-forget: DB is source of truth

  return NextResponse.json({ order });
}
