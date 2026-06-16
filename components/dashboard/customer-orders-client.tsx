"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { orderStatuses, statusLabels } from "@/lib/constants";
import { readApiResponse } from "@/lib/client-api";
import { cn, formatCurrency } from "@/lib/utils";

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: keyof typeof statusLabels;
  total: number;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
};

export function CustomerOrdersClient({ initialOrders }: { initialOrders: CustomerOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      setIsRefreshing(true);
      const response = await fetch("/api/orders", { cache: "no-store" });
      const data = await readApiResponse<{ orders?: CustomerOrder[] }>(response);
      if (!active) return;
      if (response.ok && data.orders) {
        setOrders(data.orders);
        setLastUpdated(new Date());
      }
      setIsRefreshing(false);
    }

    const interval = window.setInterval(refresh, 8000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (orders.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-border p-10 text-center">
        <h2 className="font-display text-2xl font-bold">No orders yet</h2>
        <p className="mt-2 text-muted-foreground">Your grocery orders will appear here.</p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6">
      <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-xs font-bold text-muted-foreground">
        <span>{lastUpdated ? "Last updated just now" : "Live tracking updates every 8 seconds"}</span>
        <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin text-primary")} />
      </div>
      <AnimatePresence initial={false}>
        {orders.map((order) => {
          const cancelled = order.status === "CANCELLED";
          const activeIndex = orderStatuses.indexOf(order.status);
          return (
            <motion.article
              key={order.id}
              layout
              initial={{ opacity: 0, y: 18 }}
              animate={cancelled ? { opacity: 1, y: 0, x: [0, -3, 3, 0] } : { opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={cn(
                "rounded-[1.75rem] border bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5",
                cancelled ? "border-red-200 bg-red-50/90 dark:border-red-500/30 dark:bg-red-950/25" : "border-white/70"
              )}
            >
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold">Order #{order.orderNumber}</h2>
                  <p className="text-sm text-muted-foreground">{order.items.length} items</p>
                </div>
                <div className="text-right">
                  <p className="font-black">{formatCurrency(order.total)}</p>
                  <p className={cn("mt-1 rounded-full px-3 py-1 text-xs font-black", cancelled ? "bg-red-600 text-white" : "bg-primary/10 text-primary")}>
                    {statusLabels[order.status]}
                  </p>
                </div>
              </div>
              {cancelled ? (
                <div className="mt-6 flex gap-3 rounded-2xl bg-red-100 p-4 text-red-700 dark:bg-red-500/10 dark:text-red-200">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-black">This order was cancelled</p>
                    <p className="mt-1 text-sm">Please contact Revathy Supermarket if you need help placing it again.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid gap-3 md:grid-cols-6">
                  {orderStatuses.filter((status) => status !== "CANCELLED").map((status, index) => (
                    <motion.div key={status} layout className="flex items-center gap-3 md:block">
                      <span className={index <= activeIndex ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-black text-white" : "flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-black"}>
                        {index + 1}
                      </span>
                      <p className="mt-0 text-xs font-bold md:mt-2">{statusLabels[status]}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
