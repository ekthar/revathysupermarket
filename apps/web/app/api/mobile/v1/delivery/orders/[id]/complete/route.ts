import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * POST /api/mobile/v1/delivery/orders/[id]/complete
 * Simplified delivery completion (without OTP) for the order-specific endpoint.
 * Marks order as DELIVERED and creates an OrderEvent.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DELIVERY_PARTNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      deliveryPartnerId: auth.userId,
    },
    select: { id: true, status: true, orderNumber: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotent: already delivered
  if (order.status === "DELIVERED") {
    return NextResponse.json({ ok: true, status: "DELIVERED", idempotent: true });
  }

  if (!["OUT_FOR_DELIVERY", "ARRIVING"].includes(order.status)) {
    return NextResponse.json(
      { error: "Order must be out for delivery before marking complete." },
      { status: 409 }
    );
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        status: "DELIVERED",
        paymentStatus: "PAID",
        deliveryConfirmedAt: now,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: id,
        status: "DELIVERED",
        note: "Delivery completed via mobile app.",
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    status: "DELIVERED",
    deliveredAt: now.toISOString(),
  });
}
