import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Polling endpoint for delivery partner alerts.
 * Returns current assigned orders that are ready/out-for-delivery.
 * Client polls every 5s and compares with known set to detect new assignments.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DELIVERY_PARTNER") {
    return NextResponse.json({ orders: [] });
  }

  const orders = await prisma.order.findMany({
    where: {
      deliveryPartnerId: session.user.id,
      status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "ARRIVING"] }
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      houseName: true,
      street: true,
      landmark: true,
      pincode: true,
      total: true
    },
    orderBy: { createdAt: "desc" }
  }).catch(() => []);

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      address: `${o.houseName}, ${o.street}, ${o.landmark}, ${o.pincode}`,
      total: Number(o.total)
    }))
  });
}
