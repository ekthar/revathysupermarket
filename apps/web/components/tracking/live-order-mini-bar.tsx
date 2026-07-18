"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Package, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { readApiResponse } from "@/lib/client-api";
import { estimateOrderEta, type ActiveOrderSummary } from "@/lib/live-order";
import { isDeliveryEtaVisible } from "@msm/shared";
import type { OrderStatus } from "@msm/shared";
import { haptic } from "@/lib/haptics";

const statusLabels: Record<string, string> = {
  ORDER_RECEIVED: "Received",
  AWAITING_CUSTOMER_APPROVAL: "Needs approval",
  ACCEPTED: "Confirmed",
  PACKING: "Packing",
  READY_FOR_DELIVERY: "Ready",
  OUT_FOR_DELIVERY: "On the way",
  ARRIVING: "Arriving",
};

const HIDDEN = ["/login", "/welcome", "/admin", "/delivery", "/staff", "/checkout", "/track"];

/**
 * Live order tracker — collapsible bubble design.
 * 
 * Collapsed: small floating circle (bottom-right, above tab bar)
 * Expanded: full-width pill with order info + Track button
 * 
 * Tap bubble to expand, tap X or Track to collapse/navigate.
 */
export function LiveOrderMiniBar({ initialOrder = null }: { initialOrder?: ActiveOrderSummary | null }) {
  const pathname = usePathname();
  const [activeOrder, setActiveOrder] = useState<ActiveOrderSummary | null>(initialOrder);
  const [expanded, setExpanded] = useState(false);

  const hide =
    !activeOrder ||
    HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Polling for active order — stops when no order found for 2 consecutive checks
  // D9: Skip poll entirely for logged-out users (no session cookie = no orders)
  useEffect(() => {
    // Quick check: if no auth cookie exists, skip polling entirely
    const hasSession = document.cookie.includes("next-auth.session-token") ||
      document.cookie.includes("__Secure-next-auth.session-token");
    if (!hasSession && !initialOrder) return;

    let active = true;
    let emptyCount = 0;
    let interval: ReturnType<typeof setInterval> | null = null;

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
          emptyCount = 0;
          setActiveOrder((current) =>
            current?.id === found.id && current.status === found.status
              ? current
              : { ...found, eta: estimateOrderEta(found.status) },
          );
        } else {
          emptyCount++;
          setActiveOrder(null);
          // Stop polling after 2 empty responses (no active orders)
          if (emptyCount >= 2 && interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch { /* ignore */ }
    }
    fetchActiveOrder();
    interval = setInterval(fetchActiveOrder, 30_000);
    return () => { active = false; if (interval) clearInterval(interval); };
  }, []);

  // Auto-collapse when navigating
  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  if (hide) return null;

  const shouldShow = !hide && activeOrder;
  if (!shouldShow) return null;

  const statusText = statusLabels[activeOrder.status] || activeOrder.status;
  const etaText = activeOrder.eta && isDeliveryEtaVisible(activeOrder.status as OrderStatus)
    ? `~${activeOrder.eta} min`
    : "";

  return (
    <div className="fixed z-[70] md:hidden" style={{ bottom: "calc(var(--mobile-nav-height, 64px) + 0.75rem + env(safe-area-inset-bottom, 0px))", right: "0.75rem" }}>
      <AnimatePresence mode="wait">
        {!expanded ? (
          /* ─── COLLAPSED BUBBLE ─── */
          <motion.button
            key="bubble"
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={() => { setExpanded(true); haptic("light"); }}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/30 active:scale-90 transition-transform"
            aria-label={`Order ${activeOrder.orderNumber}: ${statusText}. Tap to expand.`}
          >
            <Package className="h-6 w-6 text-white" />
            {/* Status dot — lightweight */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          </motion.button>
        ) : (
          /* ─── EXPANDED PILL ─── */
          <motion.div
            key="pill"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="w-[calc(100vw-1.5rem)] overflow-hidden rounded-[20px] bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/25"
          >
            <div className="flex items-center gap-3 p-3.5">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20"
                aria-label="Collapse tracker"
              >
                <X className="h-4 w-4 text-white" />
              </button>

              {/* Order info */}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  Order #{activeOrder.orderNumber}
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {statusText}{etaText ? ` · ${etaText}` : ""}
                </p>
              </div>

              {/* Track button */}
              <Link
                href={`/track/${activeOrder.id}`}
                onClick={() => { setExpanded(false); haptic("medium"); }}
                className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm active:scale-95 transition-transform"
              >
                Track
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
