import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { clientIp } from "@/lib/request-security";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const limit = await enforceRateLimit(`payment:verify:${clientIp(request)}`, 20, 60);
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
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid verification data" }, { status: 400 });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = parsed.data;

    // Fetch the order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        razorpayOrderId: true,
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
      return NextResponse.json({ success: true, message: "Payment already verified" });
    }

    // Verify the Razorpay order ID matches what we stored
    if (order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json(
        { error: "Payment verification failed: order mismatch" },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed: invalid signature" },
        { status: 400 }
      );
    }

    // Update order payment status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        razorpayPaymentId,
      },
    });

    return NextResponse.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { error: "Payment verification failed. Please contact support." },
      { status: 500 }
    );
  }
}
