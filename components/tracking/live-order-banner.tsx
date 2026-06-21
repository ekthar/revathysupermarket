"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Truck } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";

type ActiveOrder = {
  id: string;
  orderNumber: string;
  status: string;
  eta?: number | null;
};

const statusLabels: Record<string, string> = {
  ORDER_RECEIVED: "Order received",
  AWAITING_CUSTOMER_APPROVAL: "Awaiting approval",
  ACCEPTED: "Order confirmed",
  PACKING: "Packing your bag",
  READY_FOR_DELIVERY: "Ready for delivery",
  OUT_FOR_DELIVERY: "Out for delivery",
  ARRIVING: "Arriving soon",
};

function estimateEta(status: string): number {
  const map: Record<string, number> = {
    ORDER_RECEIVED: 20,
    AWAITING_CUSTOMER_APPROVAL: 18,
    ACCEPTED: 16,
    PACKING: 14,
    READY_FOR_DELIVERY: 10,
    OUT_FOR_DELIVERY: 8,
    ARRIVING: 3,
  };
  return map[status] || 15;
}

export function LiveOrderBanner() {
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchActiveOrder() {
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        if (!response.ok) return;
        const data = await readApiResponse<{ orders?: Array<{ id: string; orderNumber: string; status: string }> }>(response);
        if (!active || !data.orders) return;

        const liveStatuses = [
          "ORDER_RECEIVED",
          "AWAITING_CUSTOMER_APPROVAL",
          "ACCEPTED",
          "PACKING",
          "READY_FOR_DELIVERY",
          "OUT_FOR_DELIVERY",
          "ARRIVING",
        ];
        const found = data.orders.find((o) => liveStatuses.includes(o.status));
        if (found) {
          setActiveOrder({
            id: found.id,
            orderNumber: found.orderNumber,
            status: found.status,
            eta: estimateEta(found.status),
          });
        } else {
          setActiveOrder(null);
        }
      } catch {
        // ignore fetch errors
      }
    }

    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {activeOrder && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="mx-4 mb-4"
        >
          <Link
            href={`/track/${activeOrder.id}`}
            className="block overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400 p-3.5 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/30 press"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Pulse dot */}
                <div className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    Live Order
                  </p>
                  <p className="text-[13px] font-bold text-white">
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
            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-widest text-white/60">
              Tap to track
            </p>
            {/* Decorative */}
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 pointer-events-none" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
