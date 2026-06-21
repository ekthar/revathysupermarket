import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { awardDeliveredOrderBenefits } from "@/lib/loyalty";
import { sendPushToUser } from "@/lib/push";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const schema = z.object({ orderId: z.string().min(1), otp: z.string().regex(/^\d{6}$/) });
const cents = (value: Prisma.Decimal | number) => Math.round(Number(value) * 100);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DELIVERY_PARTNER") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const limit = await enforceRateLimit(`delivery:complete:${session.user.id}`, 12, 300);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Order and six-digit OTP are required.", code: "INVALID_COMPLETION" }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { id: parsed.data.orderId, deliveryPartnerId: session.user.id }, select: { id: true, status: true, deliveryOtp: true, deliveryOtpAttempts: true, deliveryOtpExpiresAt: true, userId: true, orderNumber: true, deliveryCollection: true } });
  if (!order) return NextResponse.json({ error: "Assigned order not found.", code: "ORDER_NOT_FOUND" }, { status: 404 });
  if (order.status === "DELIVERED" && order.deliveryCollection?.completionReference) return NextResponse.json({ success: true, status: "DELIVERED", idempotent: true, completionReference: order.deliveryCollection.completionReference });
  if (order.status !== "ARRIVING") return NextResponse.json({ error: "Confirm doorstep arrival before delivery.", code: "ARRIVAL_REQUIRED" }, { status: 409 });
  if (!order.deliveryCollection) return NextResponse.json({ error: "Record the collection, including a zero collection for wallet-paid orders.", code: "COLLECTION_REQUIRED" }, { status: 409 });
  if (["SHORT", "EXCESS"].includes(order.deliveryCollection.status)) return NextResponse.json({ error: "Collected amount must exactly match the remaining payable amount.", code: "COLLECTION_MISMATCH" }, { status: 409 });
  if (cents(order.deliveryCollection.cashCollected) + cents(order.deliveryCollection.upiCollected) !== cents(order.deliveryCollection.expectedAmount)) return NextResponse.json({ error: "Collection balance changed. Record it again.", code: "COLLECTION_MISMATCH" }, { status: 409 });
  if (!order.deliveryOtp || (order.deliveryOtpExpiresAt && order.deliveryOtpExpiresAt < new Date())) return NextResponse.json({ error: "OTP has expired. Ask an admin to regenerate it.", code: "OTP_EXPIRED" }, { status: 400 });
  if (order.deliveryOtpAttempts >= 3) return NextResponse.json({ error: "Too many incorrect attempts. Ask an admin to regenerate the OTP.", code: "OTP_LOCKED" }, { status: 429 });
  if (parsed.data.otp !== order.deliveryOtp) { await prisma.order.update({ where: { id: order.id }, data: { deliveryOtpAttempts: { increment: 1 } } }); return NextResponse.json({ error: "Delivery OTP is incorrect.", code: "OTP_INVALID" }, { status: 400 }); }

  const now = new Date();
  const completionReference = `DEL-${crypto.randomUUID()}`;
  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({ where: { id: order.id, status: "ARRIVING" }, data: { status: "DELIVERED", paymentStatus: "PAID", deliveryConfirmedAt: now, deliveryOtpAttempts: 0 } });
      if (claimed.count !== 1) throw new Error("ALREADY_COMPLETED");
      await tx.orderEvent.create({ data: { orderId: order.id, status: "DELIVERED", note: "OTP verified and collection balanced." } });
      await tx.deliveryCollection.update({ where: { orderId: order.id }, data: { completionReference, completedAt: now, status: Number(order.deliveryCollection!.cashCollected) === 0 && Number(order.deliveryCollection!.upiCollected) === 0 ? "SETTLED" : order.deliveryCollection!.status } });
      await tx.auditLog.create({ data: { actorId: session.user.id, actorRole: "DELIVERY_PARTNER", action: "delivery.completed", targetType: "Order", targetId: order.id, metadata: { completionReference } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_COMPLETED") {
      const existing = await prisma.deliveryCollection.findUnique({ where: { orderId: order.id } });
      return NextResponse.json({ success: true, status: "DELIVERED", idempotent: true, completionReference: existing?.completionReference });
    }
    throw error;
  }
  await awardDeliveredOrderBenefits(order.id).catch(() => null);
  await sendPushToUser(order.userId, { title: "Order delivered", body: `Order #${order.orderNumber} was delivered.`, url: "/dashboard", orderId: order.id }).catch(() => null);
  return NextResponse.json({ success: true, status: "DELIVERED", completionReference, deliveredAt: now.toISOString() });
}
