import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * POST /api/delivery/complete
 * Complete delivery: verify OTP + check collection balance.
 * Atomic and idempotent.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DELIVERY_PARTNER") {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, otp } = body as { orderId: string; otp: string };

  if (!orderId || !otp) {
    return NextResponse.json({ error: "Missing orderId or otp", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Fetch order with collection
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true, status: true, deliveryPartnerId: true, deliveryOtp: true,
      deliveryOtpAttempts: true, deliveryOtpExpiresAt: true,
      total: true, userId: true, customerName: true,
      deliveryCollection: true,
    },
  });

  if (!order || order.deliveryPartnerId !== session.user.id) {
    return NextResponse.json({ error: "Order not found or not assigned to you", code: "NOT_FOUND" }, { status: 404 });
  }

  // Idempotent: already delivered
  if (order.status === "DELIVERED") {
    return NextResponse.json({ success: true, message: "Order already delivered" });
  }

  if (!["ARRIVING", "OUT_FOR_DELIVERY"].includes(order.status)) {
    return NextResponse.json({ error: "Order not in delivery state", code: "INVALID_STATE" }, { status: 400 });
  }

  // Check OTP
  if (!order.deliveryOtp) {
    return NextResponse.json({ error: "No delivery OTP set for this order", code: "NO_OTP" }, { status: 400 });
  }

  if (order.deliveryOtpAttempts >= 5) {
    return NextResponse.json({ error: "Too many OTP attempts. Contact admin.", code: "OTP_LOCKED" }, { status: 429 });
  }

  if (order.deliveryOtpExpiresAt && new Date() > order.deliveryOtpExpiresAt) {
    return NextResponse.json({ error: "OTP has expired. Request a new one.", code: "OTP_EXPIRED" }, { status: 400 });
  }

  if (otp !== order.deliveryOtp) {
    await prisma.order.update({ where: { id: orderId }, data: { deliveryOtpAttempts: { increment: 1 } } });
    return NextResponse.json({ error: "Incorrect OTP", code: "OTP_INVALID" }, { status: 400 });
  }

  // Check collection balance
  if (order.deliveryCollection) {
    const { expectedAmount, cashCollected, upiCollected, walletApplied } = order.deliveryCollection;
    const totalCollected = Number(cashCollected) + Number(upiCollected) + Number(walletApplied);
    if (totalCollected < Number(expectedAmount)) {
      return NextResponse.json({
        error: `Collection incomplete. Expected ₹${Number(expectedAmount).toFixed(0)}, collected ₹${totalCollected.toFixed(0)}`,
        code: "COLLECTION_INCOMPLETE",
        expected: Number(expectedAmount),
        collected: totalCollected,
      }, { status: 400 });
    }
  }

  // Atomic delivery completion
  const now = new Date();
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "DELIVERED",
        paymentStatus: "PAID",
        deliveryConfirmedAt: now,
      },
    }),
    prisma.orderEvent.create({
      data: { orderId, status: "DELIVERED", note: "OTP verified and delivery confirmed" },
    }),
    ...(order.deliveryCollection ? [
      prisma.deliveryCollection.update({
        where: { orderId },
        data: { status: "PENDING_HANDOVER" },
      }),
    ] : []),
  ]);

  // Notify customer
  if (order.userId) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Order delivered!",
        body: "Your order has been delivered successfully. Enjoy!",
        type: "delivery",
        orderId,
      },
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, status: "DELIVERED", deliveredAt: now.toISOString() });
}
