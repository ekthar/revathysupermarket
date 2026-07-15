import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { createDeliveryOtp, deliveryOtpExpiryDate } from "@/lib/delivery";

/**
 * POST /api/mobile/v1/delivery/orders/[id]/pickup
 * Confirm pickup from store. Transitions order from READY_FOR_DELIVERY to OUT_FOR_DELIVERY.
 * Auto-generates a fresh delivery OTP for customer verification.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["DELIVERY_PARTNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      deliveryPartnerId: auth.userId,
    },
    select: { id: true, status: true, deliveryOtp: true, deliveryOtpExpiresAt: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotent: already picked up
  if (order.status === "OUT_FOR_DELIVERY") {
    return NextResponse.json({ ok: true, status: "OUT_FOR_DELIVERY", idempotent: true });
  }

  if (order.status !== "READY_FOR_DELIVERY") {
    return NextResponse.json(
      { error: "Order must be ready for delivery before pickup." },
      { status: 409 }
    );
  }

  // Auto-generate a fresh delivery OTP on dispatch if none exists or current one is expired
  const needsNewOtp = !order.deliveryOtp || (order.deliveryOtpExpiresAt && order.deliveryOtpExpiresAt < new Date());
  const newOtp = needsNewOtp ? createDeliveryOtp() : order.deliveryOtp;
  const newOtpExpiry = needsNewOtp ? deliveryOtpExpiryDate() : order.deliveryOtpExpiresAt;

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        status: "OUT_FOR_DELIVERY",
        deliveryOtp: newOtp,
        deliveryOtpAttempts: needsNewOtp ? 0 : undefined,
        deliveryOtpExpiresAt: newOtpExpiry,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: id,
        status: "OUT_FOR_DELIVERY",
        note: "Picked up by delivery partner.",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, status: "OUT_FOR_DELIVERY" });
}
