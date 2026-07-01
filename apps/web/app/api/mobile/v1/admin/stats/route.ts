import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/stats
 * Dashboard stats for admin mobile app.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch print_required_alert threshold
  const printFlag = await prisma.featureFlag.findUnique({
    where: { key: "print_required_alert" },
  }).catch(() => null);
  const thresholdMinutes = (printFlag?.config as { thresholdMinutes?: number } | null)?.thresholdMinutes ?? 10;
  const thresholdDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

  const [todayOrders, todayRevenue, pendingOrders, deliveredOrders, unprintedOrders] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "DELIVERED", createdAt: { gte: today } },
      }).then((r) => Number(r._sum.total ?? 0)),
      prisma.order.count({
        where: { status: { in: ["ORDER_RECEIVED", "ACCEPTED", "PACKING"] } },
      }),
      prisma.order.count({
        where: { status: "DELIVERED", createdAt: { gte: today } },
      }),
      // Unprinted orders older than threshold
      printFlag?.enabled
        ? prisma.order.count({
            where: {
              printedAt: null,
              status: { notIn: ["ORDER_RECEIVED", "CANCELLED"] },
              createdAt: { lt: thresholdDate },
            },
          })
        : Promise.resolve(0),
    ]);

  return NextResponse.json({
    todayOrders,
    todayRevenue,
    pendingOrders,
    deliveredOrders,
    unprintedOrders,
  });
}
