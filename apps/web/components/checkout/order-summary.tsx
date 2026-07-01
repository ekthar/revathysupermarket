"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  discountPrice?: number | null;
};

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  feeQuoteLoading: boolean;
  freeDeliveryThreshold: number;
  gstRatePercent: number;
  gstAmount: number;
  tipAmount?: number;
  totalAmount: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  message: string;
  addressNotCovered?: boolean;
}

export function OrderSummary({
  items,
  subtotal,
  deliveryFee,
  feeQuoteLoading,
  freeDeliveryThreshold,
  gstRatePercent,
  gstAmount,
  tipAmount = 0,
  totalAmount,
  canSubmit,
  isSubmitting,
  message,
  addressNotCovered = false,
}: OrderSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="lg:sticky lg:top-[90px] h-fit"
    >
      <section className="rounded-lg bg-white p-5 shadow-elevation-3 dark:bg-neutral-900">
        <h2 className="text-title font-black text-neutral-900 dark:text-white">Order Summary</h2>
        <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-caption">
              <span className="text-neutral-600 dark:text-neutral-400 truncate flex-1 mr-2">
                {item.name} x{item.quantity}
              </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 shrink-0">
                {formatCurrency((item.discountPrice ?? item.price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2.5 text-body">
          <div className="flex justify-between">
            <span className="text-neutral-500">Order Amount</span>
            <span className="font-semibold text-neutral-700">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Delivery</span>
            <span className="font-semibold text-neutral-700">
              {feeQuoteLoading ? (
                <span className="text-muted-foreground">Calculating...</span>
              ) : deliveryFee === 0 ? (
                <span className="text-secondary-600">FREE</span>
              ) : (
                formatCurrency(deliveryFee)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">
              {gstRatePercent > 0 ? `GST (${gstRatePercent}% incl.)` : "Tax"}
            </span>
            <span className="font-semibold text-neutral-700">{formatCurrency(gstAmount)}</span>
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Delivery tip</span>
              <span className="font-semibold text-neutral-700">{formatCurrency(tipAmount)}</span>
            </div>
          )}
          {/* Savings line */}
          {(() => {
            const totalDiscount = items.reduce((sum, item) => {
              if (item.discountPrice != null && item.discountPrice < item.price) {
                return sum + (item.price - item.discountPrice) * item.quantity;
              }
              return sum;
            }, 0);
            if (totalDiscount <= 0) return null;
            return (
              <div className="flex justify-between">
                <span className="text-secondary-600 font-medium">Total Savings</span>
                <span className="font-semibold text-secondary-600">-{formatCurrency(totalDiscount)}</span>
              </div>
            );
          })()}
          <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700 pt-3 flex justify-between">
            <span className="font-black text-neutral-900 dark:text-white">Total Amount</span>
            <span className="font-black text-neutral-900 dark:text-white text-title">
              <span className="text-black">{"₹"}</span> {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
        {message && (
          <p className="mt-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3 text-caption font-medium text-neutral-600 dark:text-neutral-300">
            {message}
          </p>
        )}
        {addressNotCovered && (
          <p className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-caption font-medium text-red-600 dark:text-red-400">
            Sorry, we are unable to deliver to your address. Please contact us for assistance.
          </p>
        )}
        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: canSubmit ? 1.01 : 1 }}
          className="mt-5 flex h-[52px] w-full items-center justify-center rounded-2xl bg-black text-body font-black text-white shadow-premium transition-opacity disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:opacity-40"
        >
          {isSubmitting ? "Placing order..." : "Place Order"}
        </motion.button>
        {!canSubmit && (
          <p className="mt-3 text-center text-caption font-medium text-neutral-400">
            Complete address, pincode & GPS to proceed
          </p>
        )}
      </section>
    </motion.div>
  );
}
