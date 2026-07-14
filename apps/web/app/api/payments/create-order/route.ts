import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { clientIp } from "@/lib/request-security";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/payments/razorpay";

const createOrderSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const limit = await enforceRateLimit(`payment:create:${clientIp(request)}`, 10, 60);
    if (limit.limited) return rateLimitResponse(limit.reset);

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Feature flag check
    const razorpayEnabled = await isFeatureEnabled("razorpay_enabled");
    if (!razorpayEnabled) {
      return NextResponse.json(
        { error: "Online payment is not available at this time" },
        { status: 400 }
      );
    }

    // Validate input
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const { orderId } = parsed.data;

    // Fetch the order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        total: true,
        orderNumber: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    // Create Razorpay order
    const amountPaise = Math.round(Number(order.total) * 100);
    const razorpayOrder = await createRazorpayOrder({
      amountPaise,
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Store the razorpay order ID on the order for later verification
    await prisma.order.update({
      where: { id: order.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: getRazorpayKeyId(),
      amount: amountPaise,
      currency: razorpayOrder.currency,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Payment order creation failed:", error);
    return NextResponse.json(
      { error: "Could not initiate payment. Please try again." },
      { status: 500 }
    );
  }
}
