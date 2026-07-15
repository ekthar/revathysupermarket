import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  ArrowRight,
  IndianRupee,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { AdminPageShell, AdminAccessDenied } from "@/components/admin/shared";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "reports.view")) {
    return <AdminAccessDenied permission="reports.view" />;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [revenueResult, orderCount, avgResult] = await Promise.all([
    prisma.order
      .aggregate({
        where: { createdAt: { gte: monthStart }, status: "DELIVERED" },
        _sum: { total: true },
      })
      .catch(() => ({ _sum: { total: null } })),
    prisma.order
      .count({ where: { createdAt: { gte: monthStart } } })
      .catch(() => 0),
    prisma.order
      .aggregate({
        where: { createdAt: { gte: monthStart }, status: "DELIVERED" },
        _avg: { total: true },
      })
      .catch(() => ({ _avg: { total: null } })),
  ]);

  const totalRevenue = Number(revenueResult._sum.total || 0);
  const avgOrderValue = Number(avgResult._avg.total || 0);

  const stats = [
    { label: "Revenue (This Month)", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee },
    { label: "Orders (This Month)", value: orderCount.toLocaleString("en-IN"), icon: TrendingUp },
    { label: "Avg. Order Value", value: `₹${Math.round(avgOrderValue).toLocaleString("en-IN")}`, icon: BarChart3 },
  ];

  const reportCards = [
    { title: "Sales Report", description: "Revenue breakdown, payment methods & trends", icon: BarChart3, href: "/admin/reports/sales" },
    { title: "Returns Report", description: "Return requests, refunds & approval status", icon: RotateCcw, href: "/admin/reports/returns" },
    { title: "Collections Report", description: "Delivery cash & UPI handover tracking", icon: Truck, href: "/admin/reports/collections" },
    { title: "Staff Activity", description: "Orders processed, packing & acknowledgment stats", icon: Users, href: "/admin/reports/staff" },
    { title: "Cancelled Orders", description: "Cancellation reasons & frequency analysis", icon: XCircle, href: "/admin/reports/cancelled" },
  ];

  return (
    <AdminPageShell eyebrow="Finance" title="Reports" variant="green">
      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
                <s.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group rounded-2xl border border-neutral-100 bg-white p-5 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <card.icon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-1" />
            </div>
            <h3 className="mt-3 font-semibold text-neutral-900 dark:text-white">{card.title}</h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{card.description}</p>
          </Link>
        ))}
      </div>
    </AdminPageShell>
  );
}
