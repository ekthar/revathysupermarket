import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/reports/returns
 * Returns report: aggregate by status, count items returned, total refund amounts.
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

  const returns = await prisma.returnRequest.findMany({
    where: {
      createdAt: { gte: start, lte: end },
    },
    select: {
      id: true,
      status: true,
      items: true,
      refundAmount: true,
    },
  });

  const byStatus: Record<string, number> = {};
  let totalItemsReturned = 0;
  let totalRefundAmount = 0;

  for (const ret of returns) {
    byStatus[ret.status] = (byStatus[ret.status] || 0) + 1;
    totalRefundAmount += Number(ret.refundAmount ?? 0);
    // items is a Json field - typically an array of items
    const items = ret.items as unknown[];
    if (Array.isArray(items)) {
      totalItemsReturned += items.length;
    }
  }

  return NextResponse.json({
    totalCount: returns.length,
    totalItemsReturned,
    totalRefundAmount,
    byStatus: Object.entries(byStatus).map(([status, count]) => ({
      status,
      count,
    })),
    dateRange: { start: start.toISOString(), end: end.toISOString() },
  });
}
