import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import {
  AdminPageShell,
  AdminAccessDenied,
  AdminStatusBadge,
  AdminEmptyState,
} from "@/components/admin/shared";
import { RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(val: Date | string | null) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function returnStatusVariant(status: string) {
  switch (status) {
    case "REFUNDED":
      return "success" as const;
    case "APPROVED":
    case "ITEM_RECEIVED":
      return "info" as const;
    case "REJECTED":
      return "error" as const;
    case "REQUESTED":
    case "UNDER_REVIEW":
      return "pending" as const;
    default:
      return "neutral" as const;
  }
}

export default async function ReturnsReportPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "returns.view")) {
    return <AdminAccessDenied permission="returns.view" />;
  }

  const returns = await prisma.returnRequest
    .findMany({
      select: {
        id: true,
        returnNumber: true,
        status: true,
        refundAmount: true,
        items: true,
        createdAt: true,
        order: {
          select: { orderNumber: true, customerName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    .catch(() => []);

  const totalReturns = returns.length;
  const approved = returns.filter((r) => r.status === "APPROVED" || r.status === "ITEM_RECEIVED" || r.status === "REFUNDED").length;
  const rejected = returns.filter((r) => r.status === "REJECTED").length;
  const pending = returns.filter((r) => r.status === "REQUESTED" || r.status === "UNDER_REVIEW").length;
  const totalRefunded = returns
    .filter((r) => r.status === "REFUNDED")
    .reduce((sum, r) => sum + Number(r.refundAmount || 0), 0);

  const summaryCards = [
    { label: "Total Returns", value: totalReturns },
    { label: "Approved", value: approved },
    { label: "Rejected", value: rejected },
    { label: "Pending", value: pending },
    { label: "Total Refunded", value: `₹${totalRefunded.toLocaleString("en-IN")}` },
  ];

  const breadcrumbs = [
    { label: "Reports", href: "/admin/reports" },
    { label: "Returns" },
  ];

  return (
    <AdminPageShell
      eyebrow="Finance"
      title="Returns Report"
      breadcrumbs={breadcrumbs}
      variant="green"
    >
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {returns.length === 0 ? (
        <div className="mt-6">
          <AdminEmptyState
            icon={RotateCcw}
            title="No return requests"
            description="No returns have been filed yet."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/80">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Return #</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Order #</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Customer</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">Amount</th>
                  <th className="px-4 py-3 text-center font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-900 dark:text-white">
                      {ret.returnNumber.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                      {ret.order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {ret.order.customerName}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-900 dark:text-white">
                      {ret.refundAmount ? `₹${Number(ret.refundAmount).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AdminStatusBadge
                        label={ret.status.replace(/_/g, " ")}
                        variant={returnStatusVariant(ret.status)}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-500 dark:text-neutral-400">
                      {formatDate(ret.createdAt)}
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
