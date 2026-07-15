import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { AdminPageShell, AdminAccessDenied, AdminEmptyState } from "@/components/admin/shared";
import { BarChart3, IndianRupee, CreditCard, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(val: Date | string | null) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function SalesReportPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "reports.view")) {
    return <AdminAccessDenied permission="reports.view" />;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    monthRevenue,
    prevMonthRevenue,
    weekRevenue,
    monthOrderCount,
    deliveredOrders,
    paymentBreakdown,
  ] = await Promise.all([
    prisma.order
      .aggregate({
        where: { createdAt: { gte: monthStart }, status: "DELIVERED" },
        _sum: { total: true },
      })
      .catch(() => ({ _sum: { total: null } })),
    prisma.order
      .aggregate({
        where: {
          createdAt: { gte: prevMonthStart, lt: monthStart },
          status: "DELIVERED",
        },
        _sum: { total: true },
      })
      .catch(() => ({ _sum: { total: null } })),
    prisma.order
      .aggregate({
        where: { createdAt: { gte: weekAgo }, status: "DELIVERED" },
        _sum: { total: true },
      })
      .catch(() => ({ _sum: { total: null } })),
    prisma.order
      .count({ where: { createdAt: { gte: monthStart } } })
      .catch(() => 0),
    prisma.order
      .findMany({
        where: { createdAt: { gte: monthStart }, status: "DELIVERED" },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
      .catch(() => []),
    prisma.order
      .groupBy({
        by: ["paymentMethod"],
        where: { createdAt: { gte: monthStart }, status: "DELIVERED" },
        _sum: { total: true },
        _count: true,
      })
      .catch(() => []),
  ]);

  const totalRevenue = Number(monthRevenue._sum.total || 0);
  const prevTotal = Number(prevMonthRevenue._sum.total || 0);
  const weekTotal = Number(weekRevenue._sum.total || 0);
  const avgOrderValue =
    deliveredOrders.length > 0
      ? totalRevenue / deliveredOrders.length
      : 0;

  const growthPercent =
    prevTotal > 0
      ? (((totalRevenue - prevTotal) / prevTotal) * 100).toFixed(1)
      : "—";

  const breadcrumbs = [
    { label: "Reports", href: "/admin/reports" },
    { label: "Sales Report" },
  ];

  return (
    <AdminPageShell
      eyebrow="Finance"
      title="Sales Report"
      variant="green"
      breadcrumbs={breadcrumbs}
    >
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
              <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">This Month</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Growth (vs last month)</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{growthPercent}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
              <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Last 7 Days</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{formatCurrency(weekTotal)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950/40">
              <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Avg Order Value</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{formatCurrency(Math.round(avgOrderValue))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {paymentBreakdown.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Payment Methods (This Month)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paymentBreakdown.map((pm) => (
              <div
                key={pm.paymentMethod}
                className="rounded-xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {pm.paymentMethod?.replace(/_/g, " ") || "Unknown"}
                </p>
                <p className="mt-1 text-lg font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(Number(pm._sum.total || 0))}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {pm._count} order{pm._count !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Delivered Orders */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Recent Sales ({monthOrderCount} orders this month)
        </h2>

        {deliveredOrders.length === 0 ? (
          <AdminEmptyState
            title="No delivered orders this month"
            description="Sales will appear here once orders are delivered."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                    <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">Order</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">Payment</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-300">Amount</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-300">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white dark:divide-neutral-800 dark:bg-neutral-950">
                  {deliveredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                        #{order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {order.paymentMethod?.replace(/_/g, " ") || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(Number(order.total))}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500 dark:text-neutral-400">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
