import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { AdminPageShell, AdminAccessDenied, AdminEmptyState } from "@/components/admin/shared";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(val: Date | string | null) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function StaffActivityPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "reports.view")) {
    return <AdminAccessDenied permission="reports.view" />;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch staff members with activity data
  const staffMembers = await prisma.user
    .findMany({
      where: {
        role: { in: ["STAFF", "PACKING_STAFF", "MANAGER"] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        lastLoginAt: true,
        acknowledgedOrders: {
          where: { acknowledgedAt: { gte: thirtyDaysAgo } },
          select: { id: true },
        },
      },
      orderBy: { lastLoginAt: "desc" },
    })
    .catch(() => []);

  // Get packing activity (status transitions to PACKING)
  const packingEvents = await prisma.orderEvent
    .groupBy({
      by: ["orderId"],
      where: {
        status: "PACKING",
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    })
    .catch(() => []);

  // Map acknowledged counts per staff
  const staffData = staffMembers.map((staff) => ({
    id: staff.id,
    name: staff.name || "Unnamed Staff",
    role: staff.role.replace(/_/g, " "),
    ordersProcessed: staff.acknowledgedOrders.length,
    lastActive: staff.lastLoginAt,
  }));

  const breadcrumbs = [
    { label: "Reports", href: "/admin/reports" },
    { label: "Staff Activity" },
  ];

  return (
    <AdminPageShell
      eyebrow="Finance"
      title="Staff Activity"
      breadcrumbs={breadcrumbs}
      variant="green"
    >
      {staffData.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No staff activity"
          description="No staff members have been active in the last 30 days."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/80">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                    Staff Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
                    Role
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">
                    Orders Processed
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {staffData.map((staff) => (
                  <tr key={staff.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                      {staff.name}
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-600 dark:text-neutral-400">
                      {staff.role.toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-900 dark:text-white">
                      {staff.ordersProcessed}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-500 dark:text-neutral-400">
                      {formatDate(staff.lastActive)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary footer */}
          <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing activity from the last 30 days · {staffData.length} staff member{staffData.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
