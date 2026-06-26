"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Truck } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";
import { estimateOrderEta, type ActiveOrderSummary } from "@/lib/live-order";

const statusLabels: Record<string, string> = {
  ORDER_RECEIVED: "Order received",
  AWAITING_CUSTOMER_APPROVAL: "Awaiting approval",
  ACCEPTED: "Order confirmed",
  PACKING: "Packing your bag",
  READY_FOR_DELIVERY: "Ready for delivery",
  OUT_FOR_DELIVERY: "Out for delivery",
  ARRIVING: "Arriving soon",
};

export function LiveOrderBanner({ initialOrder = null }: { initialOrder?: ActiveOrderSummary | null }) {
  const [activeOrder, setActiveOrder] = useState<ActiveOrderSummary | null>(initialOrder);

  useEffect(() => {
    let active = true;

    // TODO: This fetches all user orders and filters client-side to find active ones.
    // For better scalability with users who have many past orders, consider adding
    // a server-side filter (e.g. /api/orders?status=active) or a lightweight
    // /api/orders/active endpoint to reduce payload size.
    async function fetchActiveOrder() {
      try {
        if (document.visibilityState === "hidden") return;
        const response = await fetch("/api/orders/live", { cache: "no-store" });
        if (!response.ok) return;
        const data = await readApiResponse<{ orders?: Array<{ id: string; orderNumber: string; status: string }> }>(response);
        if (!active || !data.orders) return;
        const found = data.orders[0];
        if (found) {
          setActiveOrder((current) => current?.id === found.id && current.status === found.status
            ? current
            : { ...found, eta: estimateOrderEta(found.status) });
        } else {
          setActiveOrder(null);
        }
      } catch {
        // ignore fetch errors
      }
    }

    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 30000);
    document.addEventListener("visibilitychange", fetchActiveOrder);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", fetchActiveOrder);
    };
  }, []);

  return (
    <AnimatePresence>
      {activeOrder && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="mx-4 overflow-hidden"
        >
          <div className="pb-4">
          <Link
            href={`/track/${activeOrder.id}`}
            className="block overflow-hidden rounded-2xl bg-gradient-to-r from-secondary-600 via-secondary-500 to-secondary-400 p-3.5 shadow-lg shadow-secondary-500/20 dark:shadow-secondary-900/30 press"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Pulse dot */}
                <div className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                </div>
                <div>
                  <p className="text-micro font-bold uppercase tracking-wider text-white/80">
                    Live Order
                  </p>
                  <p className="text-body font-bold text-white">
                    {statusLabels[activeOrder.status] || activeOrder.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeOrder.eta && (
                  <p className="text-lg font-black text-white">
                    {activeOrder.eta} min
                  </p>
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Truck className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <p className="mt-1.5 text-micro font-semibold uppercase tracking-widest text-white/60">
              Tap to track
            </p>
            {/* Decorative */}
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 pointer-events-none" />
          </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
