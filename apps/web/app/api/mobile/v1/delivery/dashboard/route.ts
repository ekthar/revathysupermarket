import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/delivery/dashboard
 * Returns the delivery partner's active orders and today's earnings summary.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DELIVERY_PARTNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeOrders, todayCollections] = await Promise.all([
    prisma.order.findMany({
      where: {
        deliveryPartnerId: auth.userId,
        status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "ARRIVING"] },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        houseName: true,
        street: true,
        landmark: true,
        status: true,
        total: true,
        distanceKm: true,
        items: { select: { id: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deliveryCollection.findMany({
      where: {
        partnerId: auth.userId,
        completedAt: { gte: today },
      },
      select: {
        cashCollected: true,
        upiCollected: true,
      },
    }),
  ]);

  const deliveriesToday = await prisma.order.count({
    where: {
      deliveryPartnerId: auth.userId,
      status: "DELIVERED",
      deliveryConfirmedAt: { gte: today },
    },
  });

  const cashCollected = todayCollections.reduce(
    (sum, c) => sum + Number(c.cashCollected),
    0
  );
  const upiCollected = todayCollections.reduce(
    (sum, c) => sum + Number(c.upiCollected),
    0
  );

  // Lifetime total deliveries
  const lifetimeTotal = await prisma.order.count({
    where: {
      deliveryPartnerId: auth.userId,
      status: "DELIVERED",
    },
  });

  return NextResponse.json({
    activeOrders: activeOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      address: [o.houseName, o.street, o.landmark].filter(Boolean).join(", "),
      status: o.status,
      distance: o.distanceKm ? `${Number(o.distanceKm)} km` : undefined,
    })),
    deliveriesToday,
    cashCollected,
    upiCollected,
    lifetimeTotal,
  });
}
