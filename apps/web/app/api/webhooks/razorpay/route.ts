import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

/**
 * Razorpay webhook handler.
 * Handles: payment.captured, payment.failed, refund.processed
 *
 * Webhooks do NOT require auth() since they come from Razorpay servers.
 * Instead, we verify the signature using RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  try {
    // Feature flag check: when disabled, acknowledge the webhook with 200 to
    // prevent Razorpay from retrying. Payments already in flight should not be
    // blocked by a flag that gates new payment initiation.
    const razorpayEnabled = await isFeatureEnabled("razorpay_enabled");
    if (!razorpayEnabled) {
      return NextResponse.json({ status: "ok", note: "Feature disabled, event acknowledged" });
    }

    // Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature({ body: rawBody, signature });
    if (!isValid) {
      console.error("Razorpay webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event?.event ?? "";

    switch (eventType) {
      case "payment.captured": {
        const payment = event.payload?.payment?.entity;
        if (!payment) break;

        const razorpayOrderId = payment.order_id;
        if (!razorpayOrderId) break;

        // Find the order by razorpay order ID and mark as PAID
        const order = await prisma.order.findFirst({
          where: { razorpayOrderId },
          select: { id: true, paymentStatus: true },
        });

        if (order && order.paymentStatus !== "PAID") {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "PAID",
              razorpayPaymentId: payment.id,
            },
          });
        }
        break;
      }

      case "payment.failed": {
        const payment = event.payload?.payment?.entity;
        if (!payment) break;

        const razorpayOrderId = payment.order_id;
        if (!razorpayOrderId) break;

        const order = await prisma.order.findFirst({
          where: { razorpayOrderId },
          select: { id: true, paymentStatus: true },
        });

        if (order && order.paymentStatus === "PENDING") {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: "FAILED" },
          });
        }
        break;
      }

      case "refund.processed": {
        const refund = event.payload?.refund?.entity;
        if (!refund) break;

        const paymentId = refund.payment_id;
        if (!paymentId) break;

        const order = await prisma.order.findFirst({
          where: { razorpayPaymentId: paymentId },
          select: { id: true },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: "REFUNDED" },
          });
        }
        break;
      }

      default:
        // Acknowledge unknown events without processing
        break;
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
