import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { getDateRange, to2dp } from "@/lib/report-utils";

/**
 * GET /api/mobile/v1/reports/sales?period=week|month|quarter
 * Returns sales summary for delivered/paid orders within the given period.
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

  return NextResponse.json({
    totalOrders,
    totalRevenue: to2dp(totalRevenue),
    avgOrderValue: to2dp(avgOrderValue),
    periodStart,
    periodEnd,
  });
}
