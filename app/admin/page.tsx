import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canViewReports } from "@/lib/authz";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, Box, Clock, Package, ShoppingBag, Truck, Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const canSeeFinancials = canViewReports(session?.user?.role);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todayOrders, pendingOrders, packingOrders, deliveredOrders,
    receivedOrders, readyOrders, outForDeliveryOrders, totalRevenue
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
      : Promise.resolve(0)
  ]);

  const stats = [
    { label: "New Orders", value: receivedOrders, icon: Zap, color: "text-orange-500 bg-orange-50", urgent: receivedOrders > 0 },
    { label: "Today", value: todayOrders, icon: Clock, color: "text-blue-500 bg-blue-50" },
    { label: "Packing", value: packingOrders, icon: Box, color: "text-purple-500 bg-purple-50" },
    { label: "Ready", value: readyOrders, icon: Package, color: "text-yellow-600 bg-yellow-50" },
    { label: "Out for Delivery", value: outForDeliveryOrders, icon: Truck, color: "text-primary bg-emerald-50" },
    { label: "Delivered", value: deliveredOrders, icon: ShoppingBag, color: "text-slate-600 bg-slate-50" }
  ];

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Today&apos;s overview at a glance</p>
      </div>

      {/* Revenue card */}
      {canSeeFinancials && (
        <div className="admin-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Today&apos;s Revenue</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowUpRight className="h-5 w-5 text-primary" />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`admin-card p-3.5 ${stat.urgent ? "ring-2 ring-orange-200" : ""}`}>
            <div className="flex items-center justify-between">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              {stat.urgent && <span className="flex h-2 w-2 rounded-full bg-orange-500 pulse-ring" />}
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Order funnel */}
      <div className="admin-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Order Pipeline</h2>
          <Link href="/admin/orders" className="text-xs font-medium text-primary">View all →</Link>
        </div>
        <div className="space-y-2">
          {[
            { label: "Received", count: receivedOrders, pct: Math.min(100, (receivedOrders / Math.max(todayOrders, 1)) * 100), color: "bg-orange-400" },
            { label: "Packing", count: packingOrders, pct: Math.min(100, (packingOrders / Math.max(todayOrders, 1)) * 100), color: "bg-purple-400" },
            { label: "Ready", count: readyOrders, pct: Math.min(100, (readyOrders / Math.max(todayOrders, 1)) * 100), color: "bg-yellow-400" },
            { label: "Out for Delivery", count: outForDeliveryOrders, pct: Math.min(100, (outForDeliveryOrders / Math.max(todayOrders, 1)) * 100), color: "bg-primary" },
            { label: "Delivered", count: deliveredOrders, pct: Math.min(100, (deliveredOrders / Math.max(todayOrders, 1)) * 100), color: "bg-slate-400" }
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-slate-500 w-28 shrink-0">{row.label}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${row.color} transition-all`} style={{ width: `${row.pct}%` }} />
              </div>
              <span className="text-[12px] font-bold text-slate-700 w-6 text-right">{row.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/orders" className="admin-card p-4 press hover:shadow-md transition-shadow">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <p className="text-[13px] font-semibold text-slate-900 mt-2">Manage Orders</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{pendingOrders} pending</p>
        </Link>
        <Link href="/admin/products" className="admin-card p-4 press hover:shadow-md transition-shadow">
          <Package className="h-5 w-5 text-primary" />
          <p className="text-[13px] font-semibold text-slate-900 mt-2">Products</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Add & manage</p>
        </Link>
      </div>
    </div>
  );
}
