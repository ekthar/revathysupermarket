import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { AdminPageShell, AdminAccessDenied, AdminEmptyState } from "@/components/admin/shared";
import { XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(val: Date | string | null) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function CancelledOrdersPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "reports.view")) {
    return <AdminAccessDenied permission="reports.view" />;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [cancelledOrders, totalOrderCount] = await Promise.all([
    prisma.order
      .findMany({
        where: { status: "CANCELLED", createdAt: { gte: thirtyDaysAgo } },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          staffNote: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      .catch(() => []),
    prisma.order
      .count({ where: { createdAt: { gte: thirtyDaysAgo } } })
      .catch(() => 0),
  ]);

  const cancelledCount = cancelledOrders.length;
  const cancelPercentage =
    totalOrderCount > 0
      ? ((cancelledCount / totalOrderCount) * 100).toFixed(1)
      : "0";

  const breadcrumbs = [
    { label: "Reports", href: "/admin/reports" },
    { label: "Cancelled Orders" },
  ];

  return (
    <AdminPageShell
      eyebrow="Finance"
      title="Cancelled Orders"
      breadcrumbs={breadcrumbs}
      variant="green"
    >
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Cancelled (30d)</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{cancelledCount}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">% of All Orders</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{cancelPercentage}%</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Orders (30d)</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{totalOrderCount}</p>
        </div>
      </div>

      {/* Table */}
      {cancelledOrders.length === 0 ? (
        <div className="mt-6">
          <AdminEmptyState
            icon={XCircle}
            title="No cancellations"
            description="No orders have been cancelled in the last 30 days."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/80">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Order #</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Reason</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">Amount</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {cancelledOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-900 dark:text-white">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {order.staffNote || "Not specified"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-900 dark:text-white">
                      ₹{Number(order.total).toLocaleString("en-IN")}
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
    </AdminPageShell>
  );
}
