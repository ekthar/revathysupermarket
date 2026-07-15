"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Navigation, ChevronRight } from "lucide-react";
import { statusLabels } from "@/lib/constants";
import { haptic } from "@/lib/haptics";

type ActiveOrder = {
  id: string;
  orderNumber: string;
  status: keyof typeof statusLabels;
  etaMinutes?: number | null;
};

export function ActiveOrderBanner() {
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch("/api/orders/active-summary", { cache: "no-store" });
        if (res.ok && active) {
          const data = await res.json();
          if (data.order) setOrder(data.order);
          else setOrder(null);
        }
      } catch { /* silent */ }
    }
    check();
    const interval = setInterval(check, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (!order || dismissed) return null;

  const isOutForDelivery = ["OUT_FOR_DELIVERY", "ARRIVING"].includes(order.status);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-20 inset-x-4 z-[80] sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm"
      >
        <Link
          href={`/track/${order.id}`}
          onClick={() => haptic("light")}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-secondary-600 to-secondary-500 p-3.5 pr-4 shadow-xl shadow-secondary-500/30 active:scale-[0.97] transition-transform"
        >
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
            {isOutForDelivery ? (
              <Navigation className="h-5 w-5 text-white" />
            ) : (
              <Package className="h-5 w-5 text-white" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              Order #{order.orderNumber}
            </p>
            <p className="text-sm font-bold text-white truncate">
              {statusLabels[order.status]}
            </p>
          </div>

          {/* ETA or chevron */}
          {order.etaMinutes && isOutForDelivery ? (
            <div className="text-right shrink-0">
              <p className="text-xl font-black text-white">{order.etaMinutes}</p>
              <p className="text-[9px] font-bold uppercase text-white/60">MIN</p>
            </div>
          ) : (
            <ChevronRight className="h-5 w-5 text-white/60 shrink-0" />
          )}

          {/* Live pulse */}
          <span className="absolute top-3 right-3 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
