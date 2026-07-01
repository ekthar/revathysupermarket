import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/reports/collections
 * Delivery collections report: aggregate by partner, cash/UPI breakdown, reconciliation status.
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

  const collections = await prisma.deliveryCollection.findMany({
    where: {
      createdAt: { gte: start, lte: end },
    },
    select: {
      id: true,
      partnerId: true,
      cashCollected: true,
      upiCollected: true,
      status: true,
      partner: { select: { id: true, name: true } },
    },
  });

  // Aggregate by partner
  const byPartner: Record<string, { name: string; cash: number; upi: number; count: number }> = {};
  const statusCounts: Record<string, number> = {};

  for (const col of collections) {
    const pid = col.partnerId;
    if (!byPartner[pid]) {
      byPartner[pid] = { name: col.partner.name ?? "Unknown", cash: 0, upi: 0, count: 0 };
    }
    byPartner[pid].cash += Number(col.cashCollected);
    byPartner[pid].upi += Number(col.upiCollected);
    byPartner[pid].count += 1;

    statusCounts[col.status] = (statusCounts[col.status] || 0) + 1;
  }

  return NextResponse.json({
    totalCount: collections.length,
    byPartner: Object.entries(byPartner).map(([partnerId, data]) => ({
      partnerId,
      ...data,
    })),
    byStatus: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    })),
    dateRange: { start: start.toISOString(), end: end.toISOString() },
  });
}
