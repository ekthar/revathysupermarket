import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/dispatch
 * Returns dispatch board data:
 * - Unassigned orders (READY_FOR_DELIVERY without deliveryPartnerId)
 * - Available delivery partners (role=DELIVERY_PARTNER, isActive=true) with current order count
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [unassignedOrders, deliveryPartners] = await Promise.all([
    // Unassigned orders ready for delivery
    prisma.order.findMany({
      where: {
        status: "READY_FOR_DELIVERY",
        deliveryPartnerId: null,
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        houseName: true,
        street: true,
        landmark: true,
        pincode: true,
        total: true,
        distanceKm: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    // Available delivery partners with current order count
    prisma.user.findMany({
      where: {
        role: "DELIVERY_PARTNER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        currentLatitude: true,
        currentLongitude: true,
        locationUpdatedAt: true,
        _count: {
          select: {
            assignedOrders: {
              where: {
                status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "ARRIVING"] },
              },
            },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    unassignedOrders: unassignedOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      address: `${o.houseName}, ${o.street}, ${o.landmark}, ${o.pincode}`,
      total: Number(o.total),
      distanceKm: Number(o.distanceKm),
      createdAt: o.createdAt.toISOString(),
    })),
    deliveryPartners: deliveryPartners.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      currentLatitude: p.currentLatitude ? Number(p.currentLatitude) : null,
      currentLongitude: p.currentLongitude ? Number(p.currentLongitude) : null,
      locationUpdatedAt: p.locationUpdatedAt?.toISOString() ?? null,
      activeOrderCount: p._count.assignedOrders,
    })),
  });
}
