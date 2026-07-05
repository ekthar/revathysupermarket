import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canViewReports } from "@/lib/authz";
import { CancelledOrdersClient } from "@/components/admin/cancelled-orders-client";

export const dynamic = "force-dynamic";

export default async function CancelledOrdersReportPage() {
  const session = await auth();
  if (!canViewReports(session?.user?.role)) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="font-display text-2xl font-bold">Cancelled Orders Report</h2>
        <p className="mt-2 text-sm text-muted-foreground">You need report access to view this.</p>
      </div>
    );
  }

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [cancelledOrders, totalCancelledValue, cancelledCount, totalOrderCount] = await Promise.all([
    prisma.order.findMany({
      where: { status: "CANCELLED" },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        phone: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        items: { select: { name: true, quantity: true, price: true } },
        statusEvents: {
          where: { status: "CANCELLED" },
          select: { note: true, createdAt: true },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    }).catch(() => []),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: "CANCELLED" }
    }).then((r) => Number(r._sum.total ?? 0)).catch(() => 0),
    prisma.order.count({ where: { status: "CANCELLED" } }).catch(() => 0),
    prisma.order.count().catch(() => 0)
  ]);

  const cancelledRate = totalOrderCount > 0 ? ((cancelledCount / totalOrderCount) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-slate-900 p-5">
        <p className="text-caption font-bold uppercase text-red-600 dark:text-red-400">Report</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Cancelled Orders</h1>
        <p className="text-caption text-muted-foreground mt-1">Track cancellations, reasons, and revenue impact</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-caption text-muted-foreground font-medium">Total Cancelled</p>
          <p className="text-heading font-bold text-red-600 mt-1">{cancelledCount}</p>
          <p className="text-micro text-muted-foreground mt-0.5">orders</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-caption text-muted-foreground font-medium">Revenue Lost</p>
          <p className="text-heading font-bold text-foreground mt-1">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totalCancelledValue)}</p>
          <p className="text-micro text-muted-foreground mt-0.5">total value</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-caption text-muted-foreground font-medium">Cancel Rate</p>
          <p className="text-heading font-bold text-orange-600 mt-1">{cancelledRate}%</p>
          <p className="text-micro text-muted-foreground mt-0.5">of all orders</p>
        </div>
      </div>

      {/* Orders List */}
      <CancelledOrdersClient
        orders={cancelledOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          phone: o.phone,
          total: Number(o.total),
          createdAt: o.createdAt.toISOString(),
          cancelledAt: o.statusEvents[0]?.createdAt?.toISOString() || o.updatedAt.toISOString(),
          reason: o.statusEvents[0]?.note || "No reason provided",
          items: o.items.map((i) => ({ name: i.name, quantity: i.quantity, price: Number(i.price) }))
        }))}
      />
    </div>
  );
}
