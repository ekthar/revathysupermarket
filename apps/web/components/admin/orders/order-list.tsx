"use client";

import { statusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: keyof typeof statusLabels;
  deliveryPartnerId?: string | null;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number; price: number; gstRate: number | null }>;
};

interface OrderListBoardProps {
  orders: AdminOrder[];
  now: number;
  onSelectOrder: (orderNumber: string) => void;
}

function timeSince(value: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

// Colour coding per status column
const columnStyle: Record<string, { bg: string; badge: string; card: string }> = {
  ORDER_RECEIVED: {
    bg: "bg-red-50 dark:bg-red-950/30",
    badge: "bg-red-600 text-white",
    card: "border-red-100 dark:border-red-800",
  },
  ACCEPTED: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    badge: "bg-blue-600 text-white",
    card: "border-blue-100 dark:border-blue-800",
  },
  PACKING: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    badge: "bg-purple-600 text-white",
    card: "border-purple-100 dark:border-purple-800",
  },
  READY_FOR_DELIVERY: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    badge: "bg-amber-500 text-white",
    card: "border-amber-100 dark:border-amber-800",
  },
  OUT_FOR_DELIVERY: {
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    badge: "bg-cyan-600 text-white",
    card: "border-cyan-100 dark:border-cyan-800",
  },
  DELIVERED: {
    bg: "bg-green-50 dark:bg-green-950/30",
    badge: "bg-green-600 text-white",
    card: "border-green-100 dark:border-green-800",
  },
};

export function OrderListBoard({ orders, now, onSelectOrder }: OrderListBoardProps) {
  return (
    // Horizontal scroll only to show all 6 columns; each column scrolls vertically independently
    <div className="mt-5 flex gap-3 overflow-x-auto pb-3">
      {(
        [
          ["ORDER_RECEIVED", "New"],
          ["ACCEPTED", "Accepted"],
          ["PACKING", "Packing"],
          ["READY_FOR_DELIVERY", "Ready"],
          ["OUT_FOR_DELIVERY", "Out for delivery"],
          ["DELIVERED", "Completed"],
        ] as const
      ).map(([status, label]) => {
        const columnOrders = orders.filter((order) => order.status === status);
        const style = columnStyle[status] ?? { bg: "bg-muted", badge: "bg-slate-600 text-white", card: "border-border" };
        return (
          <section
            key={status}
            className={`flex w-[260px] shrink-0 flex-col rounded-2xl ${style.bg} p-3`}
          >
            {/* Column header — fixed, doesn't scroll */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">{label}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-black ${style.badge}`}>
                {columnOrders.length}
              </span>
            </div>

            {/* Cards — vertically scrollable, max height ~70vh so you don't have to scroll the whole page */}
            <div className="mt-3 flex max-h-[70vh] flex-col gap-2 overflow-y-auto pb-1 pr-0.5">
              {columnOrders.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center text-xs text-muted-foreground">
                  No orders
                </p>
              ) : (
                columnOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => onSelectOrder(order.orderNumber)}
                    className={`rounded-xl border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md ${style.card}`}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="text-xs font-black text-foreground">
                        #{order.orderNumber.slice(-6)}
                      </span>
                      <span className="text-xs font-black text-primary">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                      {order.customerName}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {order.items.length} items &middot; {timeSince(order.createdAt, now)}
                    </p>
                    {status === "READY_FOR_DELIVERY" && !order.deliveryPartnerId ? (
                      <p className="mt-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 px-2 py-1 text-[11px] font-black text-amber-700 dark:text-amber-400">
                        Driver needed
                      </p>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
