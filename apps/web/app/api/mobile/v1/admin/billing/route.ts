import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/billing
 * Billing dashboard: total revenue this month, pending payments, collection summary.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [monthlyRevenue, pendingPayments, todayCollections, recentOrders] =
    await Promise.all([
      // Total revenue this month from delivered orders
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: "DELIVERED",
          createdAt: { gte: monthStart },
        },
      }),
      // Pending payments count (orders with paymentStatus not PAID)
      prisma.order.count({
        where: {
          paymentStatus: { not: "PAID" },
          status: { notIn: ["CANCELLED"] },
        },
      }),
      // Today collections
      prisma.deliveryCollection.aggregate({
        _sum: { cashCollected: true, upiCollected: true },
        where: {
          completedAt: { gte: today },
        },
      }),
      // Recent 10 delivered orders
      prisma.order.findMany({
        where: { status: "DELIVERED" },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentMethod: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),
    ]);

  return NextResponse.json({
    monthlyRevenue: Number(monthlyRevenue._sum.total ?? 0),
    pendingPayments,
    todayCollections: Number(todayCollections._sum?.cashCollected ?? 0) + Number(todayCollections._sum?.upiCollected ?? 0),
    recentTransactions: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: Number(o.total),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
