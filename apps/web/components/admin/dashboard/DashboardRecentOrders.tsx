"use client";

import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { AdminStatusBadge, orderStatusVariant, orderStatusLabel } from "@/components/admin/shared/AdminStatusBadge";
import { formatCurrency } from "@/lib/utils";

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  itemNames: string[];
}

interface DashboardRecentOrdersProps {
  orders: RecentOrder[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function DashboardRecentOrders({ orders }: DashboardRecentOrdersProps) {
  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Recent Orders</h3>
        <p className="mt-4 text-sm text-neutral-500">No recent orders</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Recent Orders</h3>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  #{order.orderNumber}
                </span>
                <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {order.customerName}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-neutral-400 dark:text-neutral-500">
                {order.itemNames.join(", ")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {formatCurrency(order.total)}
              </span>
              <AdminStatusBadge
                label={orderStatusLabel(order.status)}
                variant={orderStatusVariant(order.status)}
                size="sm"
              />
            </div>
            <div className="hidden items-center gap-1 text-xs text-neutral-400 sm:flex">
              <Clock className="h-3 w-3" />
              {timeAgo(order.createdAt)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
