import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canViewReports } from "@/lib/authz";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const canSeeFinancials = canViewReports(session?.user?.role);
  const userName = session?.user?.name?.split(" ")[0] || "Admin";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const lastWeekEnd = new Date(today);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  lastWeekEnd.setHours(23, 59, 59, 999);

  const [
    todayOrders, pendingOrders, packingOrders, deliveredOrders,
    receivedOrders, readyOrders, outForDeliveryOrders,
    totalRevenue, totalCustomers,
    lastWeekOrders, lastWeekRevenue, lastWeekCustomers,
    recentOrders, monthlyRevenue
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }).catch(() => 0),
    prisma.order.count({ where: { status: { in: ["ORDER_RECEIVED", "ACCEPTED", "PACKING"] } } }).catch(() => 0),
    prisma.order.count({ where: { status: "PACKING" } }).catch(() => 0),
    prisma.order.count({ where: { status: "DELIVERED" } }).catch(() => 0),
    prisma.order.count({ where: { status: "ORDER_RECEIVED" } }).catch(() => 0),
    prisma.order.count({ where: { status: "READY_FOR_DELIVERY" } }).catch(() => 0),
    prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }).catch(() => 0),
    canSeeFinancials
      ? prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", createdAt: { gte: today } } }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0)
      : Promise.resolve(0),
    prisma.user.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
    // Last week comparisons
    prisma.order.count({ where: { createdAt: { gte: lastWeekStart, lte: lastWeekEnd } } }).catch(() => 0),
    canSeeFinancials
      ? prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", createdAt: { gte: lastWeekStart, lte: lastWeekEnd } } }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0)
      : Promise.resolve(0),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { lte: lastWeekEnd } } }).catch(() => 0),
    // Recent orders for table
    prisma.order.findMany({
      where: {},
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        items: { select: { name: true }, take: 2 }
      },
      orderBy: { createdAt: "desc" },
      take: 8
    }).catch(() => []),
    // Monthly revenue for chart (last 6 months)
    canSeeFinancials
      ? getMonthlyRevenue()
      : Promise.resolve([])
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Calculate percentage changes
  const orderChange = lastWeekOrders > 0 ? Math.round(((todayOrders * 7 - lastWeekOrders) / lastWeekOrders) * 100) : 0;
  const revenueChange = lastWeekRevenue > 0 ? Math.round(((totalRevenue * 7 - lastWeekRevenue) / lastWeekRevenue) * 100) : 0;
  const customerChange = lastWeekCustomers > 0 ? Math.round(((totalCustomers - lastWeekCustomers) / lastWeekCustomers) * 100) : 0;

  return (
    <AdminDashboardClient
      userName={userName}
      greeting={greeting}
      canSeeFinancials={canSeeFinancials}
      totalRevenue={totalRevenue}
      todayOrders={todayOrders}
      pendingOrders={pendingOrders}
      packingOrders={packingOrders}
      deliveredOrders={deliveredOrders}
      receivedOrders={receivedOrders}
      readyOrders={readyOrders}
      outForDeliveryOrders={outForDeliveryOrders}
      totalCustomers={totalCustomers}
      orderChange={orderChange}
      revenueChange={revenueChange}
      customerChange={customerChange}
      recentOrders={recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        total: Number(o.total),
        status: o.status,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
        itemNames: o.items.map((i) => i.name).slice(0, 2)
      }))}
      monthlyRevenue={monthlyRevenue}
    />
  );
}

async function getMonthlyRevenue() {
  const months: { month: string; revenue: number; orders: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const monthName = start.toLocaleString("en-US", { month: "short" });

    const [revenue, orders] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "DELIVERED", createdAt: { gte: start, lte: end } }
      }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0),
      prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }).catch(() => 0)
    ]);

    months.push({ month: monthName, revenue, orders });
  }

  return months;
}
