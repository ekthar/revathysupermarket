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

  const [
    todayOrders, pendingOrders, packingOrders, deliveredOrders,
    receivedOrders, readyOrders, outForDeliveryOrders, totalRevenue,
    totalCustomers
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
    prisma.user.count({ where: { role: "CUSTOMER" } }).catch(() => 0)
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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
    />
  );
}
