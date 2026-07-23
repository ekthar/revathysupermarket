"use client";

import { useState } from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import { MapPin, Clock, CreditCard, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { springs, tapScale } from "@/lib/motion";
import { formatCurrency } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

/**
 * CheckoutPreviewSheet — quick order confirmation for mobile.
 *
 * Shows a compact checkout summary in a bottom sheet:
 * - Order total + item count
 * - Delivery address (last used or default)
 * - Delivery estimate
 * - Payment method
 * - "Place Order" CTA for quick confirmation
 * - "Full Checkout" link for users who need to change details
 *
 * This reduces context switching: users can confirm simple repeat orders
 * without navigating away from the cart page. For first-time users or
 * those needing to change address/payment, the full checkout page is still
 * accessible.
 */
export function CheckoutPreviewSheet({
  open,
  onClose,
  itemCount,
  totalAmount,
  deliveryFee,
  freeDelivery,
}: {
  open: boolean;
  onClose: () => void;
  itemCount: number;
  totalAmount: number;
  deliveryFee: number;
  freeDelivery: boolean;
}) {
  const [placing, setPlacing] = useState(false);

  // Try to get last used address from localStorage
  const savedAddress = typeof window !== "undefined"
    ? (() => {
        try {
          const data = localStorage.getItem("msm-last-address");
          return data ? JSON.parse(data) as { label?: string; area?: string } : null;
        } catch { return null; }
      })()
    : null;

  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[91] bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[92] rounded-t-3xl bg-white dark:bg-neutral-900 shadow-2xl outline-none">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <Drawer.Title className="sr-only">Checkout preview</Drawer.Title>

          <div className="px-5 pb-[calc(1.5rem+var(--safe-bottom,0px))]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Order Summary</h2>
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {itemCount} item{itemCount > 1 ? "s" : ""}
              </span>
            </div>

            {/* Info rows */}
            <div className="space-y-3">
              {/* Address */}
              <div className="flex items-center gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-50 dark:bg-secondary-900/30 shrink-0">
                  <MapPin className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                    {savedAddress?.label || savedAddress?.area || "Add delivery address"}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {savedAddress ? "Deliver here" : "Required for delivery"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
              </div>

              {/* Delivery */}
              <div className="flex items-center gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 shrink-0">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">~25-40 min delivery</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {freeDelivery ? "Free delivery" : `Delivery fee: ${formatCurrency(deliveryFee)}`}
                  </p>
                </div>
              </div>

              {/* Payment */}
              <div className="flex items-center gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30 shrink-0">
                  <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Cash on Delivery</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Pay when you receive</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-4">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">Total</span>
              <span className="text-lg font-black text-neutral-900 dark:text-white tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* CTAs */}
            <div className="mt-4 space-y-2">
              {/* Full checkout — for users needing to change address/payment */}
              <motion.div whileTap={tapScale.primary} transition={springs.tap}>
                <Link
                  href="/checkout"
                  onClick={() => { onClose(); haptic("medium"); }}
                  className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold press shadow-lg"
                >
                  Continue to Checkout
                </Link>
              </motion.div>

              <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-500">
                Change address or payment method on the next screen
              </p>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
