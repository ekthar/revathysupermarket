import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageProducts, canViewReports } from "@/lib/authz";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { getStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const canSeeFinancials = canViewReports(session?.user?.role);
  const canManageCatalogue = canManageProducts(session?.user?.role);
  const userName = session?.user?.name?.split(" ")[0] || "Admin";

  // Check stock_value_visible feature flag
  const stockValueFlag = await prisma.featureFlag.findUnique({ where: { key: "stock_value_visible" } }).catch(() => null);
  const stockValueVisible = stockValueFlag?.enabled ?? false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const lastWeekEnd = new Date(today);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  lastWeekEnd.setHours(23, 59, 59, 999);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todayOrders, pendingOrders, packingOrders, deliveredOrders,
    receivedOrders, readyOrders, outForDeliveryOrders,
    totalRevenue, totalCustomers,
    lastWeekOrders, lastWeekRevenue, lastWeekCustomers,
    recentOrders, monthlyRevenue, lowStockProducts,
    settings,
    // Enhanced metrics
    todayDeliveredOrders,
    monthRevenue,
    categorySales,
    peakHoursData,
    repeatCustomerCount,
    inventoryValuation,
    totalProducts,
    databaseHealthy
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
    canSeeFinancials ? getMonthlyRevenue() : Promise.resolve([]),
    // Low stock products (stock <= 5)
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 5 } },
      select: { id: true, name: true, stock: true, image: true },
      orderBy: { stock: "asc" },
      take: 10
    }).catch(() => []),
    // Store settings for GST calculation
    getStoreSettings(),
    // Today's delivered order count
    prisma.order.count({ where: { status: "DELIVERED", createdAt: { gte: today } } }).catch(() => 0),
    // This month's revenue
    canSeeFinancials
      ? prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", createdAt: { gte: thisMonthStart } } }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0)
      : Promise.resolve(0),
    // Category-wise sales (top 8)
    canSeeFinancials
      ? getCategorySales()
      : Promise.resolve([]),
    // Peak hours (today's orders by hour)
    getPeakHours(today),
    // Repeat customers (customers with > 1 order)
    prisma.order.groupBy({ by: ["userId"], where: { userId: { not: null } }, having: { userId: { _count: { gt: 1 } } }, _count: true }).then((r) => r.length).catch(() => 0),
    // Inventory valuation (gated by stock_value_visible feature flag)
    canSeeFinancials && stockValueVisible
      ? prisma.product.aggregate({ _sum: { stock: true }, where: { isActive: true } }).then((r) => {
          // Rough valuation: sum of (price * stock) for each product
          return prisma.product.findMany({
            where: { isActive: true, stock: { gt: 0 } },
            select: { price: true, stock: true }
          }).then((products) => products.reduce((sum, p) => sum + Number(p.price) * p.stock, 0));
        }).catch(() => 0)
      : Promise.resolve(0),
    // Total active products
    prisma.product.count({ where: { isActive: true } }).catch(() => 0),
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false)
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Calculate percentage changes
  const orderChange = lastWeekOrders > 0 ? Math.round(((todayOrders * 7 - lastWeekOrders) / lastWeekOrders) * 100) : 0;
  const revenueChange = lastWeekRevenue > 0 ? Math.round(((totalRevenue * 7 - lastWeekRevenue) / lastWeekRevenue) * 100) : 0;
  const customerChange = lastWeekCustomers > 0 ? Math.round(((totalCustomers - lastWeekCustomers) / lastWeekCustomers) * 100) : 0;

  // GST: Revenue displayed on dashboard should be NET of GST (GST is hidden from dashboard per policy)
  const gstRate = settings.gstRatePercent;
  const netTodayRevenue = gstRate > 0 ? Math.round(totalRevenue / (1 + gstRate / 100)) : totalRevenue;
  const netMonthRevenue = gstRate > 0 ? Math.round(monthRevenue / (1 + gstRate / 100)) : monthRevenue;

  // Average order value (net of GST)
  const avgOrderValue = todayDeliveredOrders > 0 ? Math.round(netTodayRevenue / todayDeliveredOrders) : 0;

  return (
    <AdminDashboardClient
      userName={userName}
      greeting={greeting}
      canSeeFinancials={canSeeFinancials}
      canManageCatalogue={canManageCatalogue}
      databaseHealthy={databaseHealthy}
      totalRevenue={netTodayRevenue}
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
      lowStockProducts={lowStockProducts}
      // Enhanced metrics — GST hidden from dashboard views per policy
      monthRevenue={netMonthRevenue}
      avgOrderValue={avgOrderValue}
      categorySales={categorySales}
      peakHours={peakHoursData}
      repeatCustomers={repeatCustomerCount}
      inventoryValuation={inventoryValuation}
      stockValueVisible={stockValueVisible}
      totalProducts={totalProducts}
    />
  );
}

async function getMonthlyRevenue() {
  return unstable_cache(
    async () => {
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
    },
    ["admin-monthly-revenue"],
    { revalidate: 300, tags: ["admin-dashboard"] }
  )();
}

async function getCategorySales() {
  return unstable_cache(
    async () => {
      try {
        const items = await prisma.orderItem.findMany({
          where: { order: { status: "DELIVERED" } },
          select: {
            quantity: true,
            price: true,
            product: { select: { category: { select: { name: true } } } }
          }
        });

        const salesByCategory = new Map<string, { revenue: number; quantity: number }>();
        for (const item of items) {
          const catName = item.product?.category?.name ?? "Uncategorized";
          const existing = salesByCategory.get(catName) ?? { revenue: 0, quantity: 0 };
          existing.revenue += Number(item.price) * item.quantity;
          existing.quantity += item.quantity;
          salesByCategory.set(catName, existing);
        }

        return [...salesByCategory.entries()]
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 8)
          .map(([name, data]) => ({ name, revenue: Math.round(data.revenue), quantity: data.quantity }));
      } catch {
        return [];
      }
    },
    ["admin-category-sales"],
    { revalidate: 300, tags: ["admin-dashboard"] }
  )();
}

async function getPeakHours(today: Date) {
  try {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: today } },
      select: { createdAt: true }
    });

    const hourCounts = new Array(24).fill(0);
    for (const order of orders) {
      const hour = order.createdAt.getHours();
      hourCounts[hour]++;
    }

    // Return only hours 6-22 (typical store hours)
    return hourCounts.slice(6, 23).map((count, i) => ({
      hour: `${i + 6}:00`,
      orders: count
    }));
  } catch {
    return [];
  }
}
