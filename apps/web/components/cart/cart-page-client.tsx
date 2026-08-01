"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2, Tag, Truck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast as sonnerToast } from "sonner";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { springs, tapScale } from "@/lib/motion";
import { CartSuggestions } from "@/components/cart/cart-suggestions";
import { EmptyCartState } from "@/components/ui/empty-states";
import { haptic } from "@/lib/haptics";
import { useTranslations } from "next-intl";
import type { CartItem } from "@/lib/types";
import { CheckoutPreviewSheet } from "@/components/cart/checkout-preview-sheet";
import { FreeDeliveryProgress } from "@/components/cart/free-delivery-progress";
import { DEFAULT_STORE_CONFIG, type StoreConfig } from "@/lib/use-store-config";

export function CartPageClient({ initialConfig }: { initialConfig?: StoreConfig }) {
  const { items, subtotal, removeItem, updateQuantity, addItem } = useCart();
  const t = useTranslations("cart");
  const [promoCode, setPromoCode] = useState("");
  const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDescription, setPromoDescription] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [config, setConfig] = useState<StoreConfig>(initialConfig ?? DEFAULT_STORE_CONFIG);
  const [configLoading, setConfigLoading] = useState(!initialConfig);

  // Fetch store settings on mount (fallback if initialConfig not provided)
  useEffect(() => {
    if (initialConfig) return;
    fetch("/api/store-settings")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setConfig(data); })
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, [initialConfig]);

  // Calculate dynamic values
  const qualifiesFreeDelivery = config.freeDeliveryThreshold > 0 && subtotal >= config.freeDeliveryThreshold;
  const deliveryFee = qualifiesFreeDelivery ? 0 : config.deliveryFee;

  // GST is inclusive (already in price) — show breakdown for transparency
  const gstRate = config.gstRatePercent;
  const taxableValue = gstRate > 0 ? subtotal / (1 + gstRate / 100) : subtotal;
  const gstAmount = gstRate > 0 ? subtotal - taxableValue : 0;

  const totalAmount = subtotal - promoDiscount + deliveryFee;
  const belowMinimum = subtotal < config.minimumOrderValue && items.length > 0;

  // Total savings = per-item discounts + coupon + waived delivery. Surfacing this
  // in the sticky bar is the single most persuasive number on the page.
  const productSavings = items.reduce(
    (sum, item) => sum + (item.discountPrice ? (item.price - item.discountPrice) * item.quantity : 0),
    0
  );
  const deliverySavings = qualifiesFreeDelivery ? config.deliveryFee : 0;
  const totalSavings = productSavings + promoDiscount + deliverySavings;

  // Re-validate promo when subtotal changes
  const validatingPromoRef = useRef(false);
  useEffect(() => {
    if (!promoApplied || !promoCode.trim()) return;
    if (validatingPromoRef.current) return;
    validatingPromoRef.current = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/promo-codes/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: promoCode.trim(), subtotal })
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          setPromoDiscount(data.discount);
          setPromoDescription(data.description);
        } else {
          setPromoApplied(false);
          setPromoDiscount(0);
          setPromoDescription("");
          setPromoCode("");
          setPromoError("Promo code no longer valid for this cart.");
        }
      } catch {
        setPromoApplied(false);
        setPromoDiscount(0);
        setPromoDescription("");
        setPromoCode("");
      } finally {
        validatingPromoRef.current = false;
      }
    }, 300);
    return () => { clearTimeout(timer); validatingPromoRef.current = false; };
  }, [subtotal, promoApplied]);

  // Restore promo from sessionStorage on mount
  useEffect(() => {
    const savedCode = sessionStorage.getItem("msm-promo-code");
    const savedApplied = sessionStorage.getItem("msm-promo-applied") === "true";
    if (savedCode && savedApplied) {
      setPromoCode(savedCode);
      setPromoApplied(true);
    }
  }, []);

  // Sync promo state to sessionStorage
  useEffect(() => {
    if (promoApplied && promoCode.trim()) {
      sessionStorage.setItem("msm-promo-code", promoCode.trim());
      sessionStorage.setItem("msm-promo-applied", "true");
    } else {
      sessionStorage.removeItem("msm-promo-code");
      sessionStorage.removeItem("msm-promo-applied");
    }
  }, [promoApplied, promoCode]);

  async function applyPromo() {
    const code = promoCode.trim();
    if (code.length < 3) {
      setPromoError("Enter a valid code");
      return;
    }
    setPromoError("");
    setPromoLoading(true);
    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setPromoApplied(true);
        setPromoDiscount(data.discount);
        setPromoDescription(data.description);
        setPromoError("");
      } else {
        setPromoApplied(false);
        setPromoDiscount(0);
        setPromoDescription("");
        setPromoError(data.error || "Invalid or expired code");
      }
    } catch {
      setPromoError("Could not validate code. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo() {
    setPromoApplied(false);
    setPromoDiscount(0);
    setPromoDescription("");
    setPromoCode("");
    setPromoError("");
    sessionStorage.removeItem("msm-promo-code");
    sessionStorage.removeItem("msm-promo-applied");
  }

  const handleRemove = useCallback((item: CartItem) => {
    removeItem(item.id);
    haptic("light");
    sonnerToast(`Removed ${item.name}`, {
      action: {
        label: "Undo",
        onClick: () => {
          addItem(item, item.quantity);
          haptic("medium");
        },
      },
      duration: 4000,
    });
  }, [removeItem, addItem]);

  if (items.length === 0) {
    return (
      <main className="min-h-[65dvh] bg-background">
        <EmptyCartState />
      </main>
    );
  }

  // Smart contextual message — ONE banner.
  //
  // Free-delivery progress deliberately lives in the sticky summary bar now, so
  // this banner only carries what the bar doesn't: the minimum-order blocker and
  // the delivery estimate (read from settings rather than a hardcoded "~30 min").
  const etaText =
    config.deliveryEstimateMin && config.deliveryEstimateMax
      ? `Estimated delivery in ${config.deliveryEstimateMin}–${config.deliveryEstimateMax} min`
      : "Delivery estimate available at checkout";

  const contextMessage = belowMinimum
    ? {
        icon: "warn" as const,
        text: `Add ${formatCurrency(config.minimumOrderValue - subtotal)} more to place order (min ${formatCurrency(config.minimumOrderValue)})`
      }
    : { icon: "truck" as const, text: etaText };

  return (
    // pb-44 on mobile clears the taller sticky summary bar; the bar becomes
    // static (md:relative) from the md breakpoint up.
    <main className="mx-auto min-h-screen max-w-2xl bg-background px-4 pb-44 pt-5 md:pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 -mx-4 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/products" aria-label="Back to products" className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors press">
              <ArrowLeft className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
            </Link>
            <div>
              <h1 className="text-title font-black text-neutral-900 dark:text-white">{t("title")}</h1>
              <p className="text-micro font-semibold text-neutral-500 dark:text-neutral-400">{items.length} item{items.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <span className="text-body font-bold text-neutral-900 dark:text-white tabular-nums">
            {formatCurrency(subtotal)}
          </span>
        </div>
      </div>

      {/* Single contextual message — replaces 6 separate banners */}
      <div className={`mt-3 rounded-xl px-4 py-2.5 flex items-center gap-2.5 ${
        belowMinimum
          ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40"
          : "bg-neutral-50 dark:bg-neutral-800/50"
      }`}>
        <Truck className={`h-4 w-4 shrink-0 ${belowMinimum ? "text-amber-600" : "text-secondary-600 dark:text-secondary-400"}`} />
        <span className={`text-caption font-medium ${belowMinimum ? "text-amber-700 dark:text-amber-300" : "text-neutral-600 dark:text-neutral-300"}`}>
          {contextMessage.text}
        </span>
      </div>

      {/* Cart Items — clean list without swipe gestures */}
      <div className="mt-4 rounded-2xl bg-white dark:bg-neutral-900 shadow-elevation-1 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const price = item.discountPrice ?? item.price;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                transition={springs.layout}
                className="px-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {formatCurrency(price)} {item.unit ? `/ ${item.unit}` : "each"}
                    </p>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex h-9 shrink-0 items-center overflow-hidden rounded-full bg-neutral-900 dark:bg-white">
                    <motion.button
                      type="button"
                      onClick={() => { updateQuantity(item.id, item.quantity - 1); haptic("light"); }}
                      whileTap={{ scale: 1.3 }}
                      transition={springs.tap}
                      className="w-9 h-full flex items-center justify-center text-white dark:text-neutral-900 hover:bg-white/10 dark:hover:bg-black/10 transition-colors press"
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus className="h-3 w-3" />
                    </motion.button>
                    <motion.span
                      key={item.quantity}
                      initial={{ scale: 1.4, opacity: 0, y: -4 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={springs.tap}
                      className="w-5 text-center text-xs font-bold text-white dark:text-neutral-900 tabular-nums"
                    >
                      {item.quantity}
                    </motion.span>
                    <motion.button
                      type="button"
                      onClick={() => { updateQuantity(item.id, item.quantity + 1); haptic("light"); }}
                      whileTap={{ scale: 1.3 }}
                      transition={springs.tap}
                      className="w-9 h-full flex items-center justify-center text-white dark:text-neutral-900 hover:bg-white/10 dark:hover:bg-black/10 transition-colors press"
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus className="h-3 w-3" />
                    </motion.button>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0 min-w-[48px]">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">{formatCurrency(price * item.quantity)}</p>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Often bought together */}
      <CartSuggestions />

      {/* Coupon Section */}
      <div className="mt-4 rounded-2xl bg-white dark:bg-neutral-900 shadow-elevation-1 p-4">
        <div className="flex items-center gap-2.5">
          <Tag className="h-4 w-4 text-neutral-400 shrink-0" />
          {promoApplied ? (
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-caption font-semibold text-secondary-600">{promoCode.toUpperCase()} applied</p>
                <p className="text-micro text-neutral-500 dark:text-neutral-400">You save {formatCurrency(promoDiscount)}</p>
              </div>
              <button type="button" onClick={removePromo} className="text-caption font-semibold text-red-500 press">Remove</button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                  placeholder="Coupon code"
                  className="flex-1 h-9 bg-transparent text-sm font-medium text-neutral-800 dark:text-white outline-none placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={promoLoading}
                  className="text-caption font-bold text-neutral-900 dark:text-white press disabled:opacity-50"
                >
                  {promoLoading ? "..." : "Apply"}
                </button>
              </div>
              {promoError && <p className="text-micro text-red-500 mt-1">{promoError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Bill Details */}
      <div className="mt-4 rounded-2xl bg-white dark:bg-neutral-900 shadow-elevation-1 p-4">
        <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">Bill Details</h2>
        {configLoading ? (
          <div className="space-y-3 py-1">
            <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse w-full" />
            <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse w-1/2" />
          </div>
        ) : (
          <div className="space-y-2 text-caption">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Item total</span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatCurrency(subtotal)}</span>
            </div>
            {gstRate > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">GST ({gstRate}% incl.)</span>
                <span className="font-medium text-neutral-500 dark:text-neutral-400">{formatCurrency(gstAmount)}</span>
              </div>
            )}
            {promoApplied && (
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Coupon</span>
                <span className="font-medium text-secondary-600">-{formatCurrency(promoDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Delivery</span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {qualifiesFreeDelivery ? <span className="text-secondary-600">FREE</span> : `~${formatCurrency(deliveryFee)}`}
              </span>
            </div>
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2.5 mt-1 flex justify-between">
              <span className="font-bold text-neutral-900 dark:text-white">Total</span>
              <motion.span
                key={totalAmount}
                initial={{ scale: 1.05, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springs.snappy}
                className="font-bold text-neutral-900 dark:text-white tabular-nums"
              >
                {formatCurrency(totalAmount)}
              </motion.span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bill summary + CTA.
          The running total and the free-delivery nudge stay thumb-reachable at
          all times instead of only being visible once the customer scrolls to
          the bill block. */}
      <div className="ios-floating-action md:relative md:bottom-0 md:left-auto md:right-auto md:mt-5">
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-border bg-card/95 shadow-premium backdrop-blur-xl">
          {/* Free-delivery progress / unlocked ribbon */}
          <FreeDeliveryProgress
            subtotal={subtotal}
            threshold={config.freeDeliveryThreshold}
            variant="bar"
          />

          <div className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-micro font-semibold text-muted-foreground">
                Total
                {totalSavings > 0 && (
                  <span className="ml-1 text-secondary-600 dark:text-secondary-400">
                    · saving {formatCurrency(totalSavings)}
                  </span>
                )}
              </p>
              <motion.p
                key={totalAmount}
                initial={{ opacity: 0.6, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springs.snappy}
                className="text-title font-black tabular-nums text-foreground"
              >
                {formatCurrency(totalAmount)}
              </motion.p>
            </div>

            <motion.div whileTap={belowMinimum ? undefined : tapScale.subtle} transition={springs.enter}>
              <Link
                href={belowMinimum ? "#" : "/checkout"}
                aria-disabled={belowMinimum || undefined}
                onClick={(e) => {
                  if (belowMinimum) { e.preventDefault(); return; }
                  // On mobile: open preview sheet instead of navigating
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    e.preventDefault();
                    setCheckoutSheetOpen(true);
                    haptic("medium");
                  }
                }}
                className={`press flex h-12 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-bold ${
                  belowMinimum
                    ? "cursor-not-allowed bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                    : "bg-neutral-900 text-white shadow-lg dark:bg-white dark:text-neutral-900"
                }`}
              >
                {belowMinimum ? "Add more items" : t("checkout")}
                {!belowMinimum && <ArrowRight className="h-4 w-4" />}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Checkout preview sheet (mobile only) */}
      <CheckoutPreviewSheet
        open={checkoutSheetOpen}
        onClose={() => setCheckoutSheetOpen(false)}
        itemCount={items.length}
        totalAmount={totalAmount}
        deliveryFee={deliveryFee}
        freeDelivery={qualifiesFreeDelivery}
      />
    </main>
  );
}
