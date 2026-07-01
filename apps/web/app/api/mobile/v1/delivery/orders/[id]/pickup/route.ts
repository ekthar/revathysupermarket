import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * POST /api/mobile/v1/delivery/orders/[id]/pickup
 * Confirm pickup from store. Transitions order from READY_FOR_DELIVERY to OUT_FOR_DELIVERY.
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
    select: { id: true, status: true },
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

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status: "OUT_FOR_DELIVERY" },
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
