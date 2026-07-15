import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canViewReports } from "@/lib/authz";
import { getCachedFlags } from "@/lib/feature-flags-batch";
import { OrderService } from "@/lib/services/order-service";
import { AdminPageShell } from "@/components/admin/shared";
import { DashboardStats, DashboardOrderQueue, DashboardRecentOrders, DashboardAlerts } from "@/components/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const canSeeFinancials = canViewReports(session?.user?.role);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);

  // 6 parallel data fetches (was 24) + 1 cached flags lookup
  const [stats, lastWeekOrders, totalCustomers, recentOrders, lowStock, pipeline] =
    await Promise.all([
      OrderService.getStats(),
      prisma.order.count({ where: { createdAt: { gte: lastWeek, lt: today } } }).catch(() => 0),
      prisma.user.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
      prisma.order.findMany({
        select: { id: true, orderNumber: true, customerName: true, total: true, status: true, createdAt: true, items: { select: { name: true }, take: 2 } },
        orderBy: { createdAt: "desc" }, take: 8,
      }).catch(() => [] as never[]),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 5 } },
        select: { id: true, name: true, stock: true, image: true },
        orderBy: { stock: "asc" }, take: 5,
      }).catch(() => [] as never[]),
      Promise.all([
        prisma.order.count({ where: { status: { in: ["ORDER_RECEIVED", "ACCEPTED"] } } }).catch(() => 0),
        prisma.order.count({ where: { status: "PACKING" } }).catch(() => 0),
        prisma.order.count({ where: { status: "READY_FOR_DELIVERY" } }).catch(() => 0),
        prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }).catch(() => 0),
      ]),
    ]);

  // Cached feature flags (30s revalidate)
  const flags = await getCachedFlags(["stock_value_visible"]);

  const orderChange = lastWeekOrders > 0
    ? Math.round(((stats.todayOrders * 7 - lastWeekOrders) / lastWeekOrders) * 100)
    : 0;

  return (
    <AdminPageShell title="Command Centre" variant="green" eyebrow="Dashboard">
      <div className="space-y-6">
        <DashboardStats
          todayOrders={stats.todayOrders}
          revenue={stats.revenue}
          pendingOrders={stats.pendingOrders}
          customers={totalCustomers}
          orderChange={orderChange}
          canSeeFinancials={canSeeFinancials}
        />
        <DashboardOrderQueue
          pipeline={{ received: pipeline[0], packing: pipeline[1], ready: pipeline[2], outForDelivery: pipeline[3] }}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardRecentOrders
              orders={recentOrders.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customerName: o.customerName,
                total: Number(o.total),
                status: o.status,
                createdAt: o.createdAt.toISOString(),
                itemNames: o.items.map((i) => i.name),
              }))}
            />
          </div>
          <DashboardAlerts products={lowStock} showValuation={flags.stock_value_visible} />
        </div>
      </div>
    </AdminPageShell>
  );
}
