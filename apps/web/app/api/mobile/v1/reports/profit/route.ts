import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { getDateRange, to2dp } from "@/lib/report-utils";

/**
 * GET /api/mobile/v1/reports/profit?period=week|month|quarter
 * Returns profit analysis (revenue - cost) for delivered/paid orders.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "";

  const range = getDateRange(period);
  if (!range) {
    return NextResponse.json(
      { error: "Invalid period. Use: week, month, or quarter" },
      { status: 400 }
    );
  }

  const { start, end } = range;

  // Fetch all order items with product cost data from delivered/paid orders
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        status: "DELIVERED",
        paymentStatus: "PAID",
        createdAt: { gte: start, lte: end },
      },
    },
    select: {
      quantity: true,
      price: true,
      productId: true,
      name: true,
      product: {
        select: {
          id: true,
          name: true,
          costPrice: true,
        },
      },
    },
  });

  let totalRevenue = 0;
  let totalCost = 0;

  for (const item of orderItems) {
    const revenue = Number(item.price) * item.quantity;
    totalRevenue += revenue;

    if (item.product?.costPrice !== null && item.product?.costPrice !== undefined) {
      totalCost += Number(item.product.costPrice) * item.quantity;
    }
  }

  const grossProfit = totalRevenue - totalCost;
  const profitMarginPercent =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return NextResponse.json({
    totalRevenue: to2dp(totalRevenue),
    totalCost: to2dp(totalCost),
    grossProfit: to2dp(grossProfit),
    profitMarginPercent: to2dp(profitMarginPercent),
  });
}
