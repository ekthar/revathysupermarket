import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/collections?date=YYYY-MM-DD
 * Returns daily collection summary per delivery partner.
 * Aggregates DeliveryCollection records by partnerId for the given date.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  // Default to today if no date provided
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const collections = await prisma.deliveryCollection.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      id: true,
      orderId: true,
      partnerId: true,
      cashCollected: true,
      upiCollected: true,
      expectedAmount: true,
      status: true,
      createdAt: true,
      partner: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  // Aggregate by partner
  const partnerMap = new Map<
    string,
    {
      partnerId: string;
      partnerName: string | null;
      partnerPhone: string | null;
      totalCash: number;
      totalUpi: number;
      totalExpected: number;
      orderCount: number;
    }
  >();

  for (const collection of collections) {
    const existing = partnerMap.get(collection.partnerId);
    if (existing) {
      existing.totalCash += Number(collection.cashCollected);
      existing.totalUpi += Number(collection.upiCollected);
      existing.totalExpected += Number(collection.expectedAmount);
      existing.orderCount += 1;
    } else {
      partnerMap.set(collection.partnerId, {
        partnerId: collection.partnerId,
        partnerName: collection.partner.name,
        partnerPhone: collection.partner.phone,
        totalCash: Number(collection.cashCollected),
        totalUpi: Number(collection.upiCollected),
        totalExpected: Number(collection.expectedAmount),
        orderCount: 1,
      });
    }
  }

  return NextResponse.json({
    date: startOfDay.toISOString().split("T")[0],
    collections: Array.from(partnerMap.values()),
    totalCash: collections.reduce((sum, c) => sum + Number(c.cashCollected), 0),
    totalUpi: collections.reduce((sum, c) => sum + Number(c.upiCollected), 0),
    totalOrders: collections.length,
  });
}
