"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, ArrowUpRight, ArrowDownRight, Calendar, Clock,
  IndianRupee, Package, Search, ShoppingBag, Truck, Users, Zap,
  TrendingUp, Eye
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { formatCurrency } from "@/lib/utils";
import { RevenueChart } from "@/components/admin/revenue-chart";

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  itemNames: string[];
}

interface Props {
  userName: string;
  greeting: string;
  canSeeFinancials: boolean;
  totalRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  packingOrders: number;
  deliveredOrders: number;
  receivedOrders: number;
  readyOrders: number;
  outForDeliveryOrders: number;
  totalCustomers: number;
  orderChange: number;
  revenueChange: number;
  customerChange: number;
  recentOrders: RecentOrder[];
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  lowStockProducts: { id: string; name: string; stock: number; image: string }[];
  // Enhanced metrics
  gstRatePercent?: number;
  todayGstCollection?: number;
  monthGstCollection?: number;
  monthRevenue?: number;
  avgOrderValue?: number;
  categorySales?: { name: string; revenue: number; quantity: number }[];
  peakHours?: { hour: string; orders: number }[];
  repeatCustomers?: number;
  inventoryValuation?: number;
  totalProducts?: number;
}

const statusColors: Record<string, string> = {
  ORDER_RECEIVED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  ACCEPTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PACKING: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  READY_FOR_DELIVERY: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
};

const statusLabels: Record<string, string> = {
  ORDER_RECEIVED: "New",
  ACCEPTED: "Accepted",
  PACKING: "Packing",
  READY_FOR_DELIVERY: "Ready",
  OUT_FOR_DELIVERY: "On Way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

export function AdminDashboardClient({
  userName, greeting, canSeeFinancials, totalRevenue, todayOrders,
  pendingOrders, packingOrders, deliveredOrders, receivedOrders,
  readyOrders, outForDeliveryOrders, totalCustomers,
  orderChange, revenueChange, customerChange,
  recentOrders, monthlyRevenue, lowStockProducts,
  gstRatePercent = 0, todayGstCollection = 0, monthGstCollection = 0,
  monthRevenue = 0, avgOrderValue = 0, categorySales = [],
  peakHours = [], repeatCustomers = 0, inventoryValuation = 0, totalProducts = 0
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const todayDate = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric"
  });

  return (
    <div className="space-y-5">
      {/* Welcome header with search & date */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-50 to-lime-50 dark:from-primary/5 dark:via-slate-900 dark:to-slate-900 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-primary">{greeting}, {userName}!</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Store Dashboard</h1>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Here&apos;s what&apos;s happening today</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{todayDate}</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, products, customers..."
            className="w-full h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 pl-9 pr-4 text-[13px] text-slate-700 dark:text-white outline-none placeholder:text-slate-400 focus:border-primary/50 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>
      </div>

      {/* Key metrics with week-over-week comparison */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {canSeeFinancials && (
          <MetricCard
            icon={IndianRupee}
            iconBg="bg-emerald-50 dark:bg-emerald-950"
            iconColor="text-emerald-600"
            value={totalRevenue}
            prefix="₹"
            label="Today's Revenue"
            change={revenueChange}
          />
        )}

        <MetricCard
          icon={Clock}
          iconBg="bg-blue-50 dark:bg-blue-950"
          iconColor="text-blue-600"
          value={todayOrders}
          label="Orders Today"
          change={orderChange}
        />

        <MetricCard
          icon={Zap}
          iconBg="bg-orange-50 dark:bg-orange-950"
          iconColor="text-orange-600"
          value={pendingOrders}
          label="Pending Orders"
          pulse={receivedOrders > 0}
        />

        <MetricCard
          icon={Users}
          iconBg="bg-purple-50 dark:bg-purple-950"
          iconColor="text-purple-600"
          value={totalCustomers}
          label="Customers"
          change={customerChange}
        />
      </div>

      {/* Revenue Chart + Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Revenue chart - takes 3 columns on desktop */}
        {canSeeFinancials && monthlyRevenue.length > 0 && (
          <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Revenue Overview</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Last 6 months</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-[10px] text-slate-500">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-[10px] text-slate-500">Orders</span>
                </div>
              </div>
            </div>
            <RevenueChart data={monthlyRevenue} />
          </div>
        )}

        {/* Live order status - takes 2 columns */}
        <div className={`${canSeeFinancials && monthlyRevenue.length > 0 ? "lg:col-span-2" : "lg:col-span-5"}`}>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Live Status</h2>
              <Link href="/admin/orders" className="text-[11px] font-semibold text-primary flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { label: "New", value: receivedOrders, color: "bg-orange-500", ring: receivedOrders > 0 },
                { label: "Packing", value: packingOrders, color: "bg-purple-500", ring: false },
                { label: "Ready", value: readyOrders, color: "bg-yellow-500", ring: false },
                { label: "Out for Delivery", value: outForDeliveryOrders, color: "bg-blue-500", ring: false },
                { label: "Delivered Today", value: deliveredOrders, color: "bg-emerald-500", ring: false }
              ].map((row) => {
                const pct = todayOrders > 0 ? Math.min(100, (row.value / Math.max(todayOrders, 1)) * 100) : 0;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${row.color} ${row.ring ? "pulse-ring" : ""}`} />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 w-24 shrink-0">{row.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${row.color} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 w-6 text-right">{row.value}</span>
                  </div>
                );
              })}
            </div>

            {/* Quick action buttons */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link href="/admin/orders" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 dark:bg-primary/10 press hover:bg-primary/10 transition-colors">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-semibold text-primary">Orders</span>
              </Link>
              <Link href="/admin/products" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 press hover:bg-purple-100 transition-colors">
                <Package className="h-4 w-4 text-purple-600" />
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Products</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Row */}
      {canSeeFinancials && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {gstRatePercent > 0 && (
            <MetricCard
              icon={IndianRupee}
              iconBg="bg-teal-50 dark:bg-teal-950"
              iconColor="text-teal-600"
              value={todayGstCollection}
              prefix="₹"
              label={`GST (${gstRatePercent}%) Today`}
            />
          )}
          <MetricCard
            icon={TrendingUp}
            iconBg="bg-indigo-50 dark:bg-indigo-950"
            iconColor="text-indigo-600"
            value={avgOrderValue}
            prefix="₹"
            label="Avg Order Value"
          />
          <MetricCard
            icon={Users}
            iconBg="bg-pink-50 dark:bg-pink-950"
            iconColor="text-pink-600"
            value={repeatCustomers}
            label="Repeat Customers"
          />
          <MetricCard
            icon={Package}
            iconBg="bg-amber-50 dark:bg-amber-950"
            iconColor="text-amber-600"
            value={inventoryValuation}
            prefix="₹"
            label="Inventory Value"
          />
        </div>
      )}

      {/* Category Sales + Peak Hours */}
      {canSeeFinancials && (categorySales.length > 0 || peakHours.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {categorySales.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
              <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-3">Category-wise Sales</h2>
              <div className="space-y-2">
                {categorySales.map((cat, i) => {
                  const maxRev = categorySales[0]?.revenue || 1;
                  const pct = Math.round((cat.revenue / maxRev) * 100);
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white shrink-0 ml-2">{formatCurrency(cat.revenue)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 w-12 text-right shrink-0">{cat.quantity} sold</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {peakHours.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
              <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-3">Peak Hours Today</h2>
              <div className="flex items-end gap-1 h-32">
                {peakHours.map((h) => {
                  const maxOrders = Math.max(...peakHours.map((p) => p.orders), 1);
                  const height = Math.max(4, (h.orders / maxOrders) * 100);
                  return (
                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[8px] font-bold text-slate-500">{h.orders || ""}</span>
                      <div
                        className={`w-full rounded-t transition-all ${h.orders > 0 ? "bg-primary/70" : "bg-slate-100 dark:bg-slate-800"}`}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[7px] text-slate-400">{h.hour.split(":")[0]}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">Orders by hour (6 AM - 10 PM)</p>
            </div>
          )}
        </div>
      )}

      {/* Month Summary Card */}
      {canSeeFinancials && monthRevenue > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-emerald-50 dark:from-primary/5 dark:to-slate-900 border border-primary/20 p-4 shadow-sm">
          <h2 className="text-[13px] font-semibold text-primary">This Month</h2>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[18px] font-bold text-slate-900 dark:text-white">{formatCurrency(monthRevenue)}</p>
              <p className="text-[10px] text-slate-500">Revenue</p>
            </div>
            {gstRatePercent > 0 && (
              <div>
                <p className="text-[18px] font-bold text-slate-900 dark:text-white">{formatCurrency(monthGstCollection)}</p>
                <p className="text-[10px] text-slate-500">GST Collected</p>
              </div>
            )}
            <div>
              <p className="text-[18px] font-bold text-slate-900 dark:text-white">{totalProducts}</p>
              <p className="text-[10px] text-slate-500">Active Products</p>
            </div>
            <div>
              <p className="text-[18px] font-bold text-slate-900 dark:text-white">{Math.round((repeatCustomers / Math.max(totalCustomers, 1)) * 100)}%</p>
              <p className="text-[10px] text-slate-500">Repeat Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      {recentOrders.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Recent Orders</h2>
            <Link href="/admin/orders" className="text-[11px] font-semibold text-primary flex items-center gap-1 press">
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase">Order</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase">Customer</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase">Items</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase">Total</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase">Payment</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase">Status</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-bold text-slate-900 dark:text-white">#{order.orderNumber.slice(-5)}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{order.customerName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{order.itemNames.join(", ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-bold text-slate-900 dark:text-white">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        {order.paymentMethod === "COD" ? "COD" : "UPI"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColors[order.status] || "bg-slate-100 text-slate-600"}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders?search=${order.orderNumber}`} className="text-[11px] font-semibold text-primary press">
                        <Eye className="h-3.5 w-3.5 inline" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-slate-50 dark:divide-slate-800">
            {recentOrders.slice(0, 5).map((order) => (
              <Link key={order.id} href={`/admin/orders?search=${order.orderNumber}`} className="flex items-center gap-3 px-4 py-3 press">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-slate-900 dark:text-white">#{order.orderNumber.slice(-5)}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusColors[order.status] || "bg-slate-100 text-slate-600"}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{order.customerName} &middot; {order.itemNames.join(", ")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-bold text-slate-900 dark:text-white">{formatCurrency(order.total)}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/50 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-orange-100 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/20">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                <Package className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold text-orange-800 dark:text-orange-200">Low Stock Alert</h2>
                <p className="text-[10px] text-orange-600 dark:text-orange-400">{lowStockProducts.length} product{lowStockProducts.length > 1 ? "s" : ""} running low</p>
              </div>
            </div>
            <Link href="/admin/products" className="text-[11px] font-semibold text-orange-600 press">
              Manage →
            </Link>
          </div>
          <div className="divide-y divide-orange-50 dark:divide-orange-900/20">
            {lowStockProducts.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0">
                  {product.image && <img src={product.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300 flex-1 truncate">{product.name}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  product.stock === 0
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                }`}>
                  {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/admin/orders" className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 press hover:shadow-md transition-all group">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[12px] font-semibold text-slate-900 dark:text-white mt-3">Manage Orders</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{pendingOrders} pending</p>
        </Link>
        <Link href="/admin/products" className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 press hover:shadow-md transition-all group">
          <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Package className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-[12px] font-semibold text-slate-900 dark:text-white mt-3">Products</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Add & manage</p>
        </Link>
        <Link href="/admin/customers" className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 press hover:shadow-md transition-all group">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-[12px] font-semibold text-slate-900 dark:text-white mt-3">Customers</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{totalCustomers} registered</p>
        </Link>
        <Link href="/admin/reports" className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 press hover:shadow-md transition-all group">
          <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-[12px] font-semibold text-slate-900 dark:text-white mt-3">Reports</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sales & analytics</p>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon, iconBg, iconColor, value, prefix, label, change, pulse
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: number;
  prefix?: string;
  label: string;
  change?: number;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        {change !== undefined && change !== 0 && (
          <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${change > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        )}
        {pulse && <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500 pulse-ring" />}
      </div>
      <p className="mt-3 text-[20px] font-bold text-slate-900 dark:text-white">
        <AnimatedCounter value={value} prefix={prefix} duration={1.2} />
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {change !== undefined && change !== 0 && (
        <p className="text-[9px] text-slate-400 mt-0.5">vs last week</p>
      )}
    </div>
  );
}
