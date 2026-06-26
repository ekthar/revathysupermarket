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

export function OrderListBoard({ orders, now, onSelectOrder }: OrderListBoardProps) {
  return (
    <div className="mt-5 grid gap-3 overflow-x-auto pb-2 lg:grid-cols-6">
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
        const columnOrders = orders
          .filter((order) => order.status === status)
          .slice(0, status === "DELIVERED" ? 10 : 30);
        return (
          <section
            key={status}
            className="min-w-[240px] rounded-2xl bg-slate-100/80 p-3 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">{label}</h3>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black dark:bg-slate-800">
                {columnOrders.length}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {columnOrders.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-muted-foreground">
                  No orders
                </p>
              ) : (
                columnOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => onSelectOrder(order.orderNumber)}
                    className="rounded-xl bg-white p-3 text-left shadow-sm dark:bg-slate-800"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="text-xs font-black">#{order.orderNumber.slice(-6)}</span>
                      <span className="text-xs font-black text-primary">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold">{order.customerName}</p>
                    <p className="mt-1 text-caption text-muted-foreground">
                      {order.items.length} items &middot; {timeSince(order.createdAt, now)}
                    </p>
                    {status === "READY_FOR_DELIVERY" && !order.deliveryPartnerId ? (
                      <p className="mt-2 rounded-lg bg-amber-100 px-2 py-1 text-caption font-black text-amber-700">
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
