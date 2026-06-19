"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, IndianRupee, Package, ShoppingBag, Truck, Users, Zap } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { formatCurrency } from "@/lib/utils";

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
}

export function AdminDashboardClient({
  userName, greeting, canSeeFinancials, totalRevenue, todayOrders,
  pendingOrders, packingOrders, deliveredOrders, receivedOrders,
  readyOrders, outForDeliveryOrders, totalCustomers
}: Props) {
  return (
    <div className="space-y-5">
      {/* Welcome header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-50 to-lime-50 dark:from-primary/5 dark:via-slate-900 dark:to-slate-900 p-5">
        <p className="text-[13px] font-semibold text-primary">{greeting}, {userName}!</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Store Dashboard</h1>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Here&apos;s what&apos;s happening today</p>
      </div>

      {/* Key metrics with AnimatedCounter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {canSeeFinancials && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-3 text-[20px] font-bold text-slate-900 dark:text-white">
              <AnimatedCounter value={totalRevenue} prefix="₹" duration={1.5} />
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Today&apos;s revenue</p>
          </div>
        )}

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-3 text-[20px] font-bold text-slate-900 dark:text-white">
            <AnimatedCounter value={todayOrders} duration={1} />
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Orders today</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
              <Zap className="h-4 w-4 text-orange-600" />
            </div>
            {receivedOrders > 0 && <span className="flex h-2 w-2 rounded-full bg-orange-500 pulse-ring" />}
          </div>
          <p className="mt-3 text-[20px] font-bold text-slate-900 dark:text-white">
            <AnimatedCounter value={pendingOrders} duration={0.8} />
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pending orders</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-3 text-[20px] font-bold text-slate-900 dark:text-white">
            <AnimatedCounter value={totalCustomers} duration={1.2} />
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Customers</p>
        </div>
      </div>

      {/* Live order status */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Live Order Status</h2>
          <Link href="/admin/orders" className="text-[11px] font-semibold text-primary flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[
            { label: "New", value: receivedOrders, color: "bg-orange-500", ring: receivedOrders > 0 },
            { label: "Packing", value: packingOrders, color: "bg-purple-500", ring: false },
            { label: "Ready", value: readyOrders, color: "bg-yellow-500", ring: false },
            { label: "Out", value: outForDeliveryOrders, color: "bg-blue-500", ring: false },
            { label: "Done", value: deliveredOrders, color: "bg-slate-400", ring: false }
          ].map((item) => (
            <div key={item.label} className={`rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 text-center shadow-sm ${item.ring ? "ring-2 ring-orange-200 dark:ring-orange-800" : ""}`}>
              <div className={`mx-auto h-2 w-2 rounded-full ${item.color} ${item.ring ? "pulse-ring" : ""}`} />
              <p className="mt-2 text-[18px] font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={item.value} duration={0.8} />
              </p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Pipeline */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Order Pipeline</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: "Received", count: receivedOrders, color: "bg-orange-400" },
            { label: "Packing", count: packingOrders, color: "bg-purple-400" },
            { label: "Ready", count: readyOrders, color: "bg-yellow-400" },
            { label: "Out for Delivery", count: outForDeliveryOrders, color: "bg-blue-400" },
            { label: "Delivered", count: deliveredOrders, color: "bg-emerald-400" }
          ].map((row) => {
            const pct = todayOrders > 0 ? Math.min(100, (row.count / todayOrders) * 100) : 0;
            return (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 w-28 shrink-0">{row.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${row.color} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-6 text-right">{row.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href="/admin/orders" className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 press hover:shadow-md transition-all group">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[13px] font-semibold text-slate-900 dark:text-white mt-3">Manage Orders</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{pendingOrders} pending</p>
        </Link>
        <Link href="/admin/products" className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 press hover:shadow-md transition-all group">
          <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Package className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-[13px] font-semibold text-slate-900 dark:text-white mt-3">Products</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Add & manage</p>
        </Link>
        <Link href="/admin/customers" className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 press hover:shadow-md transition-all group">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-[13px] font-semibold text-slate-900 dark:text-white mt-3">Customers</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{totalCustomers} registered</p>
        </Link>
      </div>
    </div>
  );
}
