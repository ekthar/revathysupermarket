import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * PATCH /api/mobile/v1/packing/orders/[id]/ready
 * Mark an order as READY_FOR_DELIVERY.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PACKING_STAFF", "ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, orderNumber: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!["ACCEPTED", "PACKING"].includes(order.status)) {
    return NextResponse.json({ error: "Order cannot be marked ready from current status" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status: "READY_FOR_DELIVERY" },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: id,
        status: "READY_FOR_DELIVERY",
        note: "Marked ready by packing staff",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, status: "READY_FOR_DELIVERY" });
}
