import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canViewReports } from "@/lib/authz";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const session = await auth();
  if (!canViewReports(session?.user?.role)) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="font-display text-2xl font-bold">Billing Report</h2>
        <p className="mt-2 text-sm text-muted-foreground">Report access required.</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todayDelivered, todayRevenue,
    weekDelivered, weekRevenue,
    monthDelivered, monthRevenue,
    totalDelivered, totalRevenue,
    codTotal, upiTotal, walletTotal,
    recentDelivered
  ] = await Promise.all([
    prisma.order.count({ where: { status: "DELIVERED", deliveryConfirmedAt: { gte: today } } }).catch(() => 0),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", deliveryConfirmedAt: { gte: today } } }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0),
    prisma.order.count({ where: { status: "DELIVERED", deliveryConfirmedAt: { gte: weekStart } } }).catch(() => 0),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", deliveryConfirmedAt: { gte: weekStart } } }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0),
    prisma.order.count({ where: { status: "DELIVERED", deliveryConfirmedAt: { gte: monthStart } } }).catch(() => 0),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", deliveryConfirmedAt: { gte: monthStart } } }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0),
    prisma.order.count({ where: { status: "DELIVERED" } }).catch(() => 0),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED" } }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", paymentMethod: "COD" } }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", paymentMethod: "UPI_ON_DELIVERY" } }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED", paymentMethod: "WALLET" } }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0),
    prisma.order.findMany({
      where: { status: "DELIVERED" },
      select: { orderNumber: true, customerName: true, total: true, paymentMethod: true, deliveryConfirmedAt: true },
      orderBy: { deliveryConfirmedAt: "desc" },
      take: 20
    }).catch(() => [])
  ]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-950/20 dark:to-slate-900 p-5">
        <p className="text-caption font-bold uppercase text-primary">Finance</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Billing Report</h1>
        <p className="text-caption text-slate-500 dark:text-slate-400 mt-1">Revenue from delivered orders only</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <BillCard label="Today" orders={todayDelivered} revenue={todayRevenue} />
        <BillCard label="This Week" orders={weekDelivered} revenue={weekRevenue} />
        <BillCard label="This Month" orders={monthDelivered} revenue={monthRevenue} />
        <BillCard label="All Time" orders={totalDelivered} revenue={totalRevenue} />
      </div>

      {/* Payment Method Breakdown */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
        <h2 className="text-body font-bold text-slate-900 dark:text-white mb-3">Payment Method Breakdown</h2>
        <div className="space-y-2">
          <PaymentRow label="Cash on Delivery" amount={codTotal} total={totalRevenue} color="bg-emerald-500" />
          <PaymentRow label="UPI on Delivery" amount={upiTotal} total={totalRevenue} color="bg-blue-500" />
          <PaymentRow label="Wallet" amount={walletTotal} total={totalRevenue} color="bg-purple-500" />
        </div>
      </div>

      {/* Recent Delivered Orders */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-body font-bold text-slate-900 dark:text-white">Recent Delivered</h2>
          <a href="/api/admin/export/orders" className="text-caption font-semibold text-primary">Export CSV</a>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {recentDelivered.map((order) => (
            <div key={order.orderNumber} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-caption font-semibold text-slate-800 dark:text-white">#{order.orderNumber}</p>
                <p className="text-micro text-slate-400">{order.customerName} &middot; {order.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className="text-body font-bold text-slate-900 dark:text-white">{formatCurrency(Number(order.total))}</p>
                <p className="text-micro text-slate-400">
                  {order.deliveryConfirmedAt ? new Date(order.deliveryConfirmedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BillCard({ label, orders, revenue }: { label: string; orders: number; revenue: number }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
      <p className="text-micro text-slate-400 font-medium">{label}</p>
      <p className="text-heading font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(revenue)}</p>
      <p className="text-micro text-slate-400 mt-0.5">{orders} orders</p>
    </div>
  );
}

function PaymentRow({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-caption font-medium text-slate-600 dark:text-slate-400 w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-caption font-bold text-slate-700 dark:text-slate-300 w-16 text-right">{formatCurrency(amount)}</span>
      <span className="text-micro text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}
