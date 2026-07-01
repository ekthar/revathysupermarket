import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { getDateRange, to2dp } from "@/lib/report-utils";

/**
 * GET /api/reports/sales?period=week|month|quarter
 * Returns sales summary for delivered/paid orders within the given period.
 */
export async function GET(request: Request) {
  const result = await requireRole(["ADMIN", "OWNER"]);
  if (result instanceof NextResponse) return result;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "";

  const range = getDateRange(period);
  if (!range) {
    return NextResponse.json(
      { error: "Invalid period. Use: week, month, or quarter" },
      { status: 400 }
    );
  }

  const { start, end, periodStart, periodEnd } = range;

  // Fetch all delivered + paid orders in the range
  const orders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      paymentStatus: "PAID",
      createdAt: { gte: start, lte: end },
    },
    select: {
      total: true,
      createdAt: true,
    },
  });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, o) => sum + Number(o.total),
    0
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Daily breakdown
  const dailyMap = new Map<string, { orders: number; revenue: number }>();

  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().slice(0, 10);
    const existing = dailyMap.get(dateKey) || { orders: 0, revenue: 0 };
    existing.orders += 1;
    existing.revenue += Number(order.total);
    dailyMap.set(dateKey, existing);
  }

  const dailyBreakdown = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      orders: data.orders,
      revenue: to2dp(data.revenue),
    }));

  return NextResponse.json({
    totalOrders,
    totalRevenue: to2dp(totalRevenue),
    avgOrderValue: to2dp(avgOrderValue),
    periodStart,
    periodEnd,
    dailyBreakdown,
  });
}
