"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Package } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { readApiResponse } from "@/lib/client-api";
import { estimateOrderEta, type ActiveOrderSummary } from "@/lib/live-order";
import { springs } from "@/lib/motion";

const statusLabels: Record<string, string> = {
  ORDER_RECEIVED: "Received",
  AWAITING_CUSTOMER_APPROVAL: "Needs approval",
  ACCEPTED: "Confirmed",
  PACKING: "Packing",
  READY_FOR_DELIVERY: "Ready",
  OUT_FOR_DELIVERY: "On the way",
  ARRIVING: "Arriving",
};

const HIDDEN = ["/login", "/welcome", "/admin", "/delivery", "/staff", "/checkout"];

/**
 * Compact sticky mini-player under the header when the user has an active order.
 * Complements the fuller LiveOrderBanner on the home page.
 */
export function LiveOrderMiniBar({ initialOrder = null }: { initialOrder?: ActiveOrderSummary | null }) {
  const pathname = usePathname();
  const [activeOrder, setActiveOrder] = useState<ActiveOrderSummary | null>(initialOrder);

  const hide =
    !activeOrder ||
    HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/track/");

  useEffect(() => {
    let active = true;

    async function fetchActiveOrder() {
      try {
        if (document.visibilityState === "hidden") return;
        const response = await fetch("/api/orders/live", { cache: "no-store" });
        if (!response.ok) return;
        const data = await readApiResponse<{
          orders?: Array<{ id: string; orderNumber: string; status: string }>;
        }>(response);
        if (!active || !data.orders) return;
        const found = data.orders[0];
        if (found) {
          setActiveOrder((current) =>
            current?.id === found.id && current.status === found.status
              ? current
              : { ...found, eta: estimateOrderEta(found.status) }
          );
        } else {
          setActiveOrder(null);
        }
      } catch {
        /* ignore */
      }
    }

    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {!hide && activeOrder && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={springs.snappy}
          className="sticky top-[var(--mobile-header-height)] md:top-[70px] z-[35] overflow-hidden"
        >
          <Link
            href={`/track/${activeOrder.id}`}
            className="flex items-center gap-3 border-b border-secondary-500/20 bg-secondary-50/95 dark:bg-secondary-950/80 px-4 py-2 backdrop-blur-md press"
          >
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-white">
              <Package className="h-3.5 w-3.5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-white ring-2 ring-secondary-500 animate-pulse" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-700 dark:text-secondary-300">
                Live order · #{activeOrder.orderNumber}
              </p>
              <p className="text-xs font-bold text-foreground truncate">
                {statusLabels[activeOrder.status] || activeOrder.status}
                {activeOrder.eta ? ` · ~${activeOrder.eta} min` : ""}
              </p>
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-secondary-700 dark:text-secondary-300 shrink-0">
              Track
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
