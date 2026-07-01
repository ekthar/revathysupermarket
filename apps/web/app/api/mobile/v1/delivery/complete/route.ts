import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const schema = z.object({
  orderId: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/),
});

/**
 * POST /api/mobile/v1/delivery/complete
 * Mark a delivery as complete after OTP verification.
 */
export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DELIVERY_PARTNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Order and six-digit OTP are required." },
      { status: 400 }
    );
  }

  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId, deliveryPartnerId: auth.userId },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      deliveryOtp: true,
      deliveryOtpAttempts: true,
      deliveryOtpExpiresAt: true,
      deliveryCollection: { select: { completionReference: true, status: true, cashCollected: true, upiCollected: true, expectedAmount: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Assigned order not found." }, { status: 404 });
  }

  // Idempotent: already delivered
  if (order.status === "DELIVERED" && order.deliveryCollection?.completionReference) {
    return NextResponse.json({
      success: true,
      status: "DELIVERED",
      idempotent: true,
      completionReference: order.deliveryCollection.completionReference,
    });
  }

  if (!["OUT_FOR_DELIVERY", "ARRIVING"].includes(order.status)) {
    return NextResponse.json(
      { error: "Order must be out for delivery before completion." },
      { status: 409 }
    );
  }

  if (!order.deliveryCollection) {
    return NextResponse.json(
      { error: "Record the collection first." },
      { status: 409 }
    );
  }

  // OTP validation
  if (!order.deliveryOtp || (order.deliveryOtpExpiresAt && order.deliveryOtpExpiresAt < new Date())) {
    return NextResponse.json(
      { error: "OTP has expired. Ask an admin to regenerate it." },
      { status: 400 }
    );
  }

  if (order.deliveryOtpAttempts >= 3) {
    return NextResponse.json(
      { error: "Too many incorrect attempts. Ask an admin to regenerate the OTP." },
      { status: 429 }
    );
  }

  if (parsed.data.otp !== order.deliveryOtp) {
    await prisma.order.update({
      where: { id: order.id },
      data: { deliveryOtpAttempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "Delivery OTP is incorrect." }, { status: 400 });
  }

  const now = new Date();
  const completionReference = `DEL-${crypto.randomUUID()}`;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "DELIVERED",
        paymentStatus: "PAID",
        deliveryConfirmedAt: now,
        deliveryOtpAttempts: 0,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: "DELIVERED",
        note: "OTP verified and delivery completed via mobile.",
      },
    }),
    prisma.deliveryCollection.update({
      where: { orderId: order.id },
      data: { completionReference, completedAt: now },
    }),
  ]);

  return NextResponse.json({
    success: true,
    status: "DELIVERED",
    completionReference,
    deliveredAt: now.toISOString(),
  });
}
