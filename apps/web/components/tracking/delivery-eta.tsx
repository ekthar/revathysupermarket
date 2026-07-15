"use client";

import { motion, AnimatePresence } from "framer-motion";
import { isDeliveryEtaVisible } from "@msm/shared";
import type { OrderStatus } from "@msm/shared";
import { springs } from "@/lib/motion";

interface DeliveryEtaTrackingProps {
  /** Current order status */
  status: string;
  /** Estimated time of arrival in minutes */
  etaMinutes: number | null;
  /** Whether the order has been delivered */
  isDelivered?: boolean;
  /** Optional className for the wrapper */
  className?: string;
}

/**
 * Conditionally renders the delivery ETA on the customer-facing order tracking page.
 * Only shows the ETA when the order status is OUT_FOR_DELIVERY or ARRIVING,
 * as determined by `isDeliveryEtaVisible(status)` from @msm/shared.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
export function DeliveryEtaTracking({
  status,
  etaMinutes,
  isDelivered = false,
  className = "",
}: DeliveryEtaTrackingProps) {
  // Use the shared utility to determine if ETA should be visible
  const shouldShowEta = isDeliveryEtaVisible(status as OrderStatus);

  // Don't render ETA section if status doesn't allow it
  if (!shouldShowEta || etaMinutes === null || isDelivered) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="eta"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={springs.layout}
        className={`rounded-2xl bg-white p-5 text-center card-shadow dark:bg-neutral-900 ${className}`}
      >
        <p className="text-caption font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Arriving in
        </p>
        <p className="mt-1 font-display text-4xl font-black text-neutral-900 dark:text-white">
          {etaMinutes}{" "}
          <span className="text-lg font-bold text-neutral-400">min</span>
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Returns the ETA display value for the top banner, or null if ETA should be hidden.
 * Uses `isDeliveryEtaVisible(status)` to determine visibility.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
export function getVisibleEtaMinutes(
  status: string,
  etaMinutes: number | null
): number | null {
  if (!isDeliveryEtaVisible(status as OrderStatus)) {
    return null;
  }
  return etaMinutes;
}
