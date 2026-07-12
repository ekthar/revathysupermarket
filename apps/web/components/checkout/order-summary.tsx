"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { springs } from "@/lib/motion";

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
  promoDiscount?: number;
  totalAmount: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  message: string;
  addressNotCovered?: boolean;
  /** Optional explicit blocker copy when submit is disabled */
  blockReason?: string | null;
  minimumOrderValue?: number;
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
  promoDiscount = 0,
  totalAmount,
  canSubmit,
  isSubmitting,
  message,
  addressNotCovered = false,
  blockReason = null,
  minimumOrderValue = 0,
}: OrderSummaryProps) {
  const totalDiscount = items.reduce((sum, item) => {
    if (item.discountPrice != null && item.discountPrice < item.price) {
      return sum + (item.price - item.discountPrice) * item.quantity;
    }
    return sum;
  }, 0);

  const helperText =
    blockReason ||
    (addressNotCovered
      ? "We can't deliver to this address"
      : minimumOrderValue > 0 && subtotal < minimumOrderValue
        ? `Add ${formatCurrency(minimumOrderValue - subtotal)} more to meet the minimum`
        : !canSubmit
          ? "Complete address & GPS to place order"
          : null);

  return (
    <>
      {/* Desktop / inline summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="lg:sticky lg:top-[90px] h-fit hidden lg:block"
      >
        <section className="rounded-lg bg-white p-5 shadow-elevation-3 dark:bg-neutral-900">
          <h2 className="text-title font-black text-neutral-900 dark:text-white">Order Summary</h2>
          <div className="mt-4 space-y-2 max-h-[280px] overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-caption">
                <span className="text-neutral-600 dark:text-neutral-400 truncate flex-1 mr-2">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 shrink-0 tabular-nums">
                  {formatCurrency((item.discountPrice ?? item.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <SummaryLines
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            feeQuoteLoading={feeQuoteLoading}
            freeDeliveryThreshold={freeDeliveryThreshold}
            gstRatePercent={gstRatePercent}
            gstAmount={gstAmount}
            tipAmount={tipAmount}
            promoDiscount={promoDiscount}
            totalAmount={totalAmount}
            totalDiscount={totalDiscount}
          />
          {message && (
            <p className="mt-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3 text-caption font-medium text-neutral-600 dark:text-neutral-300">
              {message}
            </p>
          )}
          {addressNotCovered && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-caption font-medium text-red-600">
              Sorry, we are unable to deliver to your address.
            </p>
          )}
          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileTap={canSubmit ? { scale: 0.97 } : undefined}
            className="mt-5 flex h-[52px] w-full items-center justify-center rounded-2xl bg-black text-body font-black text-white shadow-premium transition-opacity disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:opacity-40"
          >
            {isSubmitting ? "Placing order..." : `Place Order · ${formatCurrency(totalAmount)}`}
          </motion.button>
          {helperText && !canSubmit && (
            <p className="mt-3 text-center text-caption font-medium text-neutral-400">{helperText}</p>
          )}
        </section>
      </motion.div>

      {/* Mobile sticky place-order bar */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-[55] border-t border-border bg-background/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,var(--safe-bottom))] shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.15)]"
        data-hide-on-keyboard="true"
      >
        <div className="mx-auto max-w-lg">
          {helperText && !canSubmit && (
            <p className="mb-2 text-center text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              {helperText}
              {minimumOrderValue > 0 && subtotal < minimumOrderValue && (
                <>
                  {" · "}
                  <Link href="/products" className="underline">
                    Add items
                  </Link>
                </>
              )}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</p>
              <motion.p
                key={totalAmount}
                initial={{ opacity: 0.6, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springs.snappy}
                className="text-lg font-black tabular-nums text-foreground leading-tight"
              >
                {formatCurrency(totalAmount)}
              </motion.p>
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 h-12 rounded-2xl bg-black text-sm font-black text-white press disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:opacity-50"
            >
              {isSubmitting ? "Placing…" : "Place order"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile summary card (above sticky bar in document flow) */}
      <section className="lg:hidden rounded-lg bg-white p-4 shadow-elevation-3 dark:bg-neutral-900 mb-24">
        <h2 className="text-sm font-black text-neutral-900 dark:text-white">Order Summary</h2>
        <SummaryLines
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          feeQuoteLoading={feeQuoteLoading}
          freeDeliveryThreshold={freeDeliveryThreshold}
          gstRatePercent={gstRatePercent}
          gstAmount={gstAmount}
          tipAmount={tipAmount}
          promoDiscount={promoDiscount}
          totalAmount={totalAmount}
          totalDiscount={totalDiscount}
        />
      </section>
    </>
  );
}

function SummaryLines({
  subtotal,
  deliveryFee,
  feeQuoteLoading,
  freeDeliveryThreshold,
  gstRatePercent,
  gstAmount,
  tipAmount,
  promoDiscount,
  totalAmount,
  totalDiscount,
}: {
  subtotal: number;
  deliveryFee: number;
  feeQuoteLoading: boolean;
  freeDeliveryThreshold: number;
  gstRatePercent: number;
  gstAmount: number;
  tipAmount: number;
  promoDiscount: number;
  totalAmount: number;
  totalDiscount: number;
}) {
  return (
    <div className="mt-4 space-y-2.5 text-body">
      <div className="flex justify-between">
        <span className="text-neutral-500">Order Amount</span>
        <span className="font-semibold text-neutral-700 tabular-nums">{formatCurrency(subtotal)}</span>
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
      {freeDeliveryThreshold > 0 && deliveryFee > 0 && subtotal < freeDeliveryThreshold && (
        <p className="text-micro text-muted-foreground -mt-1">
          Free delivery above {formatCurrency(freeDeliveryThreshold)}
        </p>
      )}
      {gstAmount > 0 && (
        <div className="flex justify-between">
          <span className="text-neutral-500">
            {gstRatePercent > 0 ? `GST (${gstRatePercent}% incl.)` : "Tax"}
          </span>
          <span className="font-semibold text-neutral-700 tabular-nums">{formatCurrency(gstAmount)}</span>
        </div>
      )}
      {tipAmount > 0 && (
        <div className="flex justify-between">
          <span className="text-neutral-500">Delivery tip</span>
          <span className="font-semibold text-neutral-700 tabular-nums">{formatCurrency(tipAmount)}</span>
        </div>
      )}
      {promoDiscount > 0 && (
        <div className="flex justify-between">
          <span className="text-secondary-600 font-medium">Coupon discount</span>
          <span className="font-semibold text-secondary-600 tabular-nums">-{formatCurrency(promoDiscount)}</span>
        </div>
      )}
      {totalDiscount > 0 && (
        <div className="flex justify-between">
          <span className="text-secondary-600 font-medium">Total Savings</span>
          <span className="font-semibold text-secondary-600 tabular-nums">-{formatCurrency(totalDiscount)}</span>
        </div>
      )}
      <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700 pt-3 flex justify-between">
        <span className="font-black text-neutral-900 dark:text-white">Total Amount</span>
        <span className="font-black text-neutral-900 dark:text-white text-title tabular-nums">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}
