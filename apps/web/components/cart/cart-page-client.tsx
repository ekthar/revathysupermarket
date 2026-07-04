"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Tag, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { springPresets } from "@/lib/motion";
import { ExpressCheckout } from "@/components/cart/express-checkout";
import { useTranslations } from "next-intl";

type StoreConfig = {
  gstRatePercent: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minimumOrderValue: number;
  storeName: string;
  gstin: string;
};

export function CartPageClient() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const t = useTranslations("cart");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDescription, setPromoDescription] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [config, setConfig] = useState<StoreConfig>({
    gstRatePercent: 0,
    deliveryFee: 40,
    freeDeliveryThreshold: 500,
    minimumOrderValue: 99,
    storeName: "",
    gstin: ""
  });

  // Fetch store settings on mount
  useEffect(() => {
    fetch("/api/store-settings")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setConfig(data); })
      .catch(() => {});
  }, []);

  // Calculate dynamic values
  const qualifiesFreeDelivery = config.freeDeliveryThreshold > 0 && subtotal >= config.freeDeliveryThreshold;
  // The exact fee depends on the checkout address and is calculated server-side.
  const deliveryFee = 0;
  
  // GST is inclusive (already in price) - show breakdown for transparency
  const gstRate = config.gstRatePercent;
  const taxableValue = gstRate > 0 ? subtotal / (1 + gstRate / 100) : subtotal;
  const gstAmount = gstRate > 0 ? subtotal - taxableValue : 0;
  
  const totalAmount = subtotal - promoDiscount + deliveryFee;
  const belowMinimum = subtotal < config.minimumOrderValue && items.length > 0;

  const totalSavings = items.reduce((sum, item) => {
    if (item.discountPrice) return sum + (item.price - item.discountPrice) * item.quantity;
    return sum;
  }, 0) + promoDiscount;

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
          setPromoError("");
        }
      } catch {
        setPromoApplied(false);
        setPromoDiscount(0);
        setPromoDescription("");
        setPromoCode("");
        setPromoError("");
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
      // Re-validation will trigger via the effect above when subtotal is stable
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

    // Optimistic: show coupon applied immediately with estimated discount
    const estimatedDiscount = Math.min(subtotal * 0.1, 50); // Optimistic estimate
    setPromoApplied(true);
    setPromoDiscount(estimatedDiscount);
    setPromoDescription("Validating...");
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
        // Update with actual server values
        setPromoDiscount(data.discount);
        setPromoDescription(data.description);
        setPromoError("");
      } else {
        // Rollback: coupon invalid
        setPromoApplied(false);
        setPromoDiscount(0);
        setPromoDescription("");
        setPromoError(data.error || "Invalid code");
      }
    } catch {
      // Rollback: network error
      setPromoApplied(false);
      setPromoDiscount(0);
      setPromoDescription("");
      setPromoError("Could not validate code");
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

  function handleRemove(id: string) {
    // Optimistic: immediately start exit animation and remove
    setRemovingId(id);
    // Remove from cart state immediately (optimistic) - animation handles visual
    requestAnimationFrame(() => {
      removeItem(id);
      setRemovingId(null);
    });
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-[65dvh] flex-col items-center justify-center bg-background px-6 text-center">
        <div className="h-20 w-20 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
          <ShoppingBag className="h-9 w-9 text-neutral-300 dark:text-neutral-600" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-neutral-900 dark:text-white">{t("empty")}</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Add items from the store to get started</p>
        <Link href="/products" className="mt-6 h-12 px-8 inline-flex items-center justify-center rounded-full bg-neutral-900 dark:bg-white dark:text-neutral-900 text-sm font-bold text-white hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-[0.98] transition-all press shadow-lg">
          {t("continueShopping")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-background px-4 pb-36 pt-5 md:pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 -mx-4 bg-background/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/products" className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors press">
              <ArrowLeft className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
            </Link>
            <div>
              <p className="text-caption font-black uppercase tracking-[0.28em] text-neutral-400">{items.length} item{items.length > 1 ? "s" : ""} in cart</p>
              <h1 className="text-title font-black text-neutral-900 dark:text-white">{t("title")}</h1>
            </div>
          </div>
          <span className="text-body font-bold text-neutral-900 dark:text-white">{formatCurrency(subtotal)}</span>
        </div>
      </div>

      {/* Continue Shopping Link */}
      <div className="mt-2 mb-1">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary hover:underline press">
          <ArrowLeft className="h-3 w-3" />
          Continue Shopping
        </Link>
      </div>

      {/* Minimum order warning */}
      {belowMinimum && (
        <div className="mt-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-caption font-semibold text-amber-700 dark:text-amber-300">
            Minimum order value is {formatCurrency(config.minimumOrderValue)}. Add {formatCurrency(config.minimumOrderValue - subtotal)} more to place order.
          </p>
        </div>
      )}

      {/* Express Checkout */}
      <div className="mt-3">
        <ExpressCheckout />
      </div>

      {/* Savings Summary Banner */}
      {totalSavings > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800 p-3 flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800 shrink-0">
            <Tag className="h-4 w-4 text-secondary-600" />
          </div>
          <p className="text-caption font-bold text-secondary-700 dark:text-secondary-300">
            You are saving {formatCurrency(totalSavings)} on this order!
          </p>
        </motion.div>
      )}

      {/* Cart Items */}
      <div className="mt-3 overflow-hidden rounded-lg bg-white shadow-elevation-3 divide-y divide-neutral-50 dark:divide-neutral-800">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const price = item.discountPrice ?? item.price;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: removingId === item.id ? 0 : 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-sm border-2 border-secondary-500 flex items-center justify-center shrink-0 hidden xs:flex">
                    <div className="h-2 w-2 rounded-full bg-secondary-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-neutral-800 dark:text-white truncate">{item.name}</p>
                    <p className="text-caption text-neutral-400 mt-0.5">{item.unit || "per item"}</p>
                  </div>

                  <div className="flex h-[30px] shrink-0 items-center overflow-hidden rounded-full bg-black">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-full flex items-center justify-center text-white hover:bg-white/10 active:bg-white/20 transition-colors press"
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-caption font-bold text-white">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-full flex items-center justify-center text-white hover:bg-white/10 active:bg-white/20 transition-colors press"
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-[52px]">
                    <p className="text-body font-bold text-neutral-900 dark:text-white">{formatCurrency(price * item.quantity)}</p>
                    {item.discountPrice && (
                      <p className="text-micro text-neutral-400 line-through">{formatCurrency(item.price * item.quantity)}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors press shrink-0"
                  >
                    <Trash2 className="h-3 w-3 text-neutral-300 hover:text-red-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Coupon Section */}
      <div className="mt-3 rounded-lg bg-white p-3.5 shadow-elevation-2 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-neutral-400 shrink-0" />
          {promoApplied ? (
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-caption font-semibold text-secondary-600">Code applied: {promoCode.toUpperCase()}</p>
                <p className="text-micro text-neutral-400">{promoDescription} &mdash; You save {formatCurrency(promoDiscount)}</p>
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
                  placeholder="Apply coupon code"
                  className="flex-1 h-9 bg-transparent text-body font-medium text-neutral-800 dark:text-white outline-none placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={promoLoading}
                  className="text-caption font-bold text-primary press disabled:opacity-50"
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
      <div className="mt-3 rounded-lg bg-white p-4 shadow-elevation-2 dark:bg-neutral-900">
        <h2 className="text-body font-bold text-neutral-900 dark:text-white mb-3">Bill Details</h2>
        <div className="space-y-2.5 text-caption">
          <div className="flex justify-between">
            <span className="text-neutral-500 dark:text-neutral-400">Item total</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatCurrency(subtotal)}</span>
          </div>
          {gstRate > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">GST ({gstRate}% inclusive)</span>
              <span className="font-medium text-neutral-500 dark:text-neutral-400">{formatCurrency(gstAmount)}</span>
            </div>
          )}
          {promoApplied && (
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Coupon discount</span>
              <span className="font-medium text-secondary-600">-{formatCurrency(promoDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500 dark:text-neutral-400">Delivery fee</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {qualifiesFreeDelivery ? <span className="text-secondary-600">FREE</span> : <span>Calculated at checkout</span>}
            </span>
          </div>
          {qualifiesFreeDelivery && (
            <p className="text-micro text-secondary-600 -mt-1">Free delivery on orders above {formatCurrency(config.freeDeliveryThreshold)}</p>
          )}
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2.5 flex justify-between">
            <span className="font-bold text-neutral-900 dark:text-white">Cart total</span>
            <span className="font-bold text-neutral-900 dark:text-white">{formatCurrency(totalAmount)}</span>
          </div>
          {gstRate > 0 && (
            <p className="text-micro text-neutral-400">Prices are inclusive of {gstRate}% GST{config.gstin ? ` (GSTIN: ${config.gstin})` : ""}</p>
          )}
        </div>
        {totalSavings > 0 && (
          <div className="mt-3 rounded-lg bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-100 dark:border-secondary-900 px-3 py-2">
            <p className="text-caption font-semibold text-secondary-700 dark:text-secondary-300">
              You&apos;re saving {formatCurrency(totalSavings)} on this order!
            </p>
          </div>
        )}
      </div>

      {/* Fixed bottom checkout button */}
      <div className="ios-floating-action md:relative md:bottom-0 md:left-auto md:right-auto md:mt-5 md:p-0">
        <motion.div whileTap={{ scale: 0.96 }} transition={springPresets.default}>
          <Link
            href={belowMinimum ? "#" : "/checkout"}
            onClick={(e) => { if (belowMinimum) e.preventDefault(); }}
            className={`mx-auto flex h-[54px] max-w-md items-center justify-between rounded-2xl px-5 shadow-premium press ${belowMinimum ? "bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed" : "bg-black text-white"}`}
          >
            <div>
              <p className="text-body font-bold">{belowMinimum ? "Add more items" : t("checkout")}</p>
              <p className="text-micro text-white/70">{items.length} item{items.length > 1 ? "s" : ""}</p>
            </div>
            <span className="text-title font-bold">{formatCurrency(totalAmount)}</span>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
