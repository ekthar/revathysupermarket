import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/reports/cancelled
 * Cancelled orders report with date range filtering.
 * Returns count of cancelled orders, grouped by reason, and total refund amounts.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const now = new Date();
  const start = startParam ? new Date(startParam) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = endParam ? new Date(endParam) : now;

  const cancelledOrders = await prisma.order.findMany({
    where: {
      status: "CANCELLED",
      createdAt: { gte: start, lte: end },
    },
    select: {
      id: true,
      total: true,
      statusEvents: {
        where: { status: "CANCELLED" },
        select: { note: true },
        take: 1,
      },
    },
  });

  const totalCount = cancelledOrders.length;
  const totalRefundAmount = cancelledOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  const reasonCounts: Record<string, number> = {};
  for (const order of cancelledOrders) {
    const reason = order.statusEvents[0]?.note || "Unknown";
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  }

  return NextResponse.json({
    totalCount,
    totalRefundAmount,
    byReason: Object.entries(reasonCounts).map(([reason, count]) => ({
      reason,
      count,
    })),
    dateRange: { start: start.toISOString(), end: end.toISOString() },
  });
}
