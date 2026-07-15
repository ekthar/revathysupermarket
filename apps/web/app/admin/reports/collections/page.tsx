import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import {
  AdminPageShell,
  AdminAccessDenied,
  AdminStatusBadge,
  AdminEmptyState,
} from "@/components/admin/shared";
import { Truck } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(val: Date | string | null) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function collectionStatusVariant(status: string) {
  switch (status) {
    case "SETTLED":
      return "success" as const;
    case "PENDING_HANDOVER":
      return "pending" as const;
    case "UPI_AWAITING_VERIFICATION":
      return "warning" as const;
    case "SHORT":
      return "error" as const;
    case "EXCESS":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

export default async function CollectionsReportPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "collections.view")) {
    return <AdminAccessDenied permission="collections.view" />;
  }

  const collections = await prisma.deliveryCollection
    .findMany({
      select: {
        id: true,
        expectedAmount: true,
        cashCollected: true,
        upiCollected: true,
        status: true,
        createdAt: true,
        order: { select: { orderNumber: true } },
        partner: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    .catch(() => []);

  const totalCollected = collections.reduce(
    (sum, c) => sum + Number(c.cashCollected) + Number(c.upiCollected),
    0
  );
  const totalCash = collections.reduce((sum, c) => sum + Number(c.cashCollected), 0);
  const totalUpi = collections.reduce((sum, c) => sum + Number(c.upiCollected), 0);
  const pendingHandovers = collections.filter((c) => c.status === "PENDING_HANDOVER").length;

  const summaryCards = [
    { label: "Total Collected", value: `₹${totalCollected.toLocaleString("en-IN")}` },
    { label: "Cash", value: `₹${totalCash.toLocaleString("en-IN")}` },
    { label: "UPI", value: `₹${totalUpi.toLocaleString("en-IN")}` },
    { label: "Pending Handovers", value: pendingHandovers },
  ];

  const breadcrumbs = [
    { label: "Reports", href: "/admin/reports" },
    { label: "Collections" },
  ];

  return (
    <AdminPageShell
      eyebrow="Finance"
      title="Collections Report"
      breadcrumbs={breadcrumbs}
      variant="green"
    >
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      {collections.length === 0 ? (
        <div className="mt-6">
          <AdminEmptyState
            icon={Truck}
            title="No collections"
            description="No delivery collections recorded yet."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/80">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Order #</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Partner</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">Expected</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">Cash</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">UPI</th>
                  <th className="px-4 py-3 text-center font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {collections.map((col) => (
                  <tr key={col.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-900 dark:text-white">
                      {col.order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {col.partner.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                      ₹{Number(col.expectedAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-900 dark:text-white">
                      ₹{Number(col.cashCollected).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-900 dark:text-white">
                      ₹{Number(col.upiCollected).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AdminStatusBadge
                        label={col.status.replace(/_/g, " ")}
                        variant={collectionStatusVariant(col.status)}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-500 dark:text-neutral-400">
                      {formatDate(col.createdAt)}
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
