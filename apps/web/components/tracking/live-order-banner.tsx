"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Truck } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";
import { estimateOrderEta, type ActiveOrderSummary } from "@/lib/live-order";
import { springs } from "@/lib/motion";

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
    let interval: ReturnType<typeof setInterval> | undefined = setInterval(fetchActiveOrder, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchActiveOrder();
        if (interval) clearInterval(interval);
        interval = setInterval(fetchActiveOrder, 30000);
      } else {
        if (interval) clearInterval(interval);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div className="mx-4">
      <AnimatePresence>
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={springs.enter}
          >
            <div className="pb-4">
            <Link
              href={`/track/${activeOrder.id}`}
              className="block overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-secondary-600/90 via-secondary-500/90 to-secondary-400/90 p-3.5 shadow-lg shadow-secondary-500/20 backdrop-blur-xl dark:shadow-secondary-900/30 press"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Pulse dot */}
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="stay-light absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="stay-light relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-micro font-bold uppercase tracking-wider text-white/90">
                      Live Order
                    </p>
                    <p className="text-body font-bold text-white">
                      {statusLabels[activeOrder.status] || activeOrder.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeOrder.eta && (
                    <div className="text-right">
                      <p className="text-lg font-black text-white">
                        ~{activeOrder.eta} min
                      </p>
                      <p className="text-micro font-medium text-white/80">
                        {["OUT_FOR_DELIVERY", "ARRIVING"].includes(activeOrder.status) ? "delivery" : "est. total"}
                      </p>
                    </div>
                  )}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-micro font-semibold uppercase tracking-widest text-white/80">
                Tap to track
              </p>
              {/* Decorative */}
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 pointer-events-none" />
            </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
