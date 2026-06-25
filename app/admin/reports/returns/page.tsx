import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatCurrency } from "@/lib/utils";
import { ReturnsReportClient } from "@/components/admin/returns-report-client";

export const dynamic = "force-dynamic";

export default async function DailyReturnsReportPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !["OWNER", "MANAGER", "ADMIN"].includes(role)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Daily Returns Report</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner/Manager access required.</p>
      </div>
    );
  }

  // Get returns grouped by day for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const returns = await prisma.returnRequest.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: {
      id: true,
      returnNumber: true,
      status: true,
      refundAmount: true,
      refundMethod: true,
      createdAt: true,
      reason: true,
      items: true,
      order: { select: { orderNumber: true, customerName: true, total: true } }
    },
    orderBy: { createdAt: "desc" }
  }).catch(() => []);

  // Group by date
  type ReturnEntry = (typeof returns)[number];
  const byDate = new Map<string, { date: string; returns: ReturnEntry[]; total: number; count: number }>();
  for (const ret of returns) {
    const dateKey = ret.createdAt.toISOString().split("T")[0];
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { date: dateKey, returns: [], total: 0, count: 0 });
    }
    const group = byDate.get(dateKey)!;
    group.returns.push(ret);
    group.total += Number(ret.refundAmount ?? 0);
    group.count++;
  }

  const dailyData = Array.from(byDate.values());
  const grandTotal = dailyData.reduce((sum, day) => sum + day.total, 0);

  // Today's orders total for net calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = await prisma.order.aggregate({
    where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
    _sum: { total: true }
  }).catch(() => ({ _sum: { total: null } }));

  const todaySales = Number(todayOrders._sum?.total ?? 0);
  const todayReturns = byDate.get(today.toISOString().split("T")[0])?.total ?? 0;
  const netSales = todaySales - todayReturns;

  return (
    <main className="grid gap-5">
      <section className="rounded-xl bg-[linear-gradient(135deg,rgba(239,68,68,0.1),rgba(251,146,60,0.12))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-red-600 dark:text-red-400">Returns deduction</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Daily Returns Report</h1>
        <p className="mt-2 text-sm text-muted-foreground">Per-day return totals deducted from main software sales.</p>
      </section>

      {/* Today's Net Summary */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-soft dark:border-emerald-800 dark:bg-emerald-950/20">
          <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Today Sales</p>
          <p className="mt-2 text-2xl font-black text-emerald-800 dark:text-emerald-300">{formatCurrency(todaySales)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 shadow-soft dark:border-red-800 dark:bg-red-950/20">
          <p className="text-xs font-black uppercase text-red-700 dark:text-red-400">Today Returns</p>
          <p className="mt-2 text-2xl font-black text-red-800 dark:text-red-300">- {formatCurrency(todayReturns)}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 shadow-soft dark:border-blue-800 dark:bg-blue-950/20">
          <p className="text-xs font-black uppercase text-blue-700 dark:text-blue-400">Net Sales Today</p>
          <p className="mt-2 text-2xl font-black text-blue-800 dark:text-blue-300">{formatCurrency(netSales)}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-soft dark:border-amber-800 dark:bg-amber-950/20">
          <p className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">30-Day Returns</p>
          <p className="mt-2 text-2xl font-black text-amber-800 dark:text-amber-300">{formatCurrency(grandTotal)}</p>
        </div>
      </div>

      {/* Daily breakdown */}
      <section className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
        <h2 className="font-display text-2xl font-black">Day-by-day breakdown</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-black">Date</th>
                <th className="pb-3 font-black">Returns</th>
                <th className="pb-3 text-right font-black">Total Refund</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day) => (
                <tr key={day.date} className="border-b border-border/50">
                  <td className="py-3 font-bold">{new Date(day.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-3">{day.count} return{day.count !== 1 ? "s" : ""}</td>
                  <td className="py-3 text-right font-black text-red-600 dark:text-red-400">- {formatCurrency(day.total)}</td>
                </tr>
              ))}
              {dailyData.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted-foreground">No returns in the last 30 days.</td>
                </tr>
              )}
            </tbody>
            {dailyData.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td className="pt-3 font-black">Total</td>
                  <td className="pt-3 font-bold">{returns.length} returns</td>
                  <td className="pt-3 text-right text-lg font-black text-red-600 dark:text-red-400">- {formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Per-day expandable item breakdown */}
      <ReturnsReportClient
        dailyData={dailyData.map((day) => ({
          ...day,
          returns: day.returns.map((ret) => ({
            ...ret,
            refundAmount: Number(ret.refundAmount ?? 0),
            createdAt: ret.createdAt.toISOString(),
            order: {
              ...ret.order,
              total: Number(ret.order.total),
            },
          })),
        }))}
      />

      {/* Recent returns detail */}
      <section className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
        <h2 className="font-display text-2xl font-black">Recent returns detail</h2>
        <div className="mt-4 grid gap-2">
          {returns.slice(0, 20).map((ret) => (
            <div key={ret.id} className="flex items-center justify-between rounded-2xl bg-muted p-3">
              <div>
                <p className="text-sm font-bold">#{ret.order.orderNumber} — {ret.order.customerName}</p>
                <p className="text-xs text-muted-foreground">{ret.returnNumber} • {ret.status}</p>
              </div>
              <span className="font-black text-red-600 dark:text-red-400">- {formatCurrency(Number(ret.refundAmount ?? 0))}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <a href="/admin/reports" className="inline-flex h-11 items-center rounded-2xl border border-border px-5 text-sm font-black">
          ← Back to Reports
        </a>
      </div>
    </main>
  );
}
