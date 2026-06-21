"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Tag, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";

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

  async function applyPromo() {
    const code = promoCode.trim();
    if (code.length < 3) {
      setPromoError("Enter a valid code");
      return;
    }
    setPromoLoading(true);
    setPromoError("");
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
        setPromoError(data.error || "Invalid code");
        setPromoApplied(false);
        setPromoDiscount(0);
      }
    } catch {
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
  }

  function handleRemove(id: string) {
    setRemovingId(id);
    setTimeout(() => { removeItem(id); setRemovingId(null); }, 180);
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-[65dvh] flex-col items-center justify-center bg-[#F7F7FA] px-6 text-center">
        <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
          <ShoppingBag className="h-9 w-9 text-slate-300 dark:text-slate-600" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add items from the store to get started</p>
        <Link href="/products" className="mt-6 h-12 px-8 inline-flex items-center justify-center rounded-full bg-slate-900 dark:bg-white dark:text-slate-900 text-sm font-bold text-white press shadow-lg">
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#F7F7FA] px-4 pb-36 pt-5 md:pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 -mx-4 bg-[#F7F7FA]/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/products" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 press">
              <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            </Link>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">{items.length} item{items.length > 1 ? "s" : ""}</p>
              <h1 className="text-[18px] font-black text-slate-900 dark:text-white">Your cart</h1>
            </div>
          </div>
          <span className="text-[14px] font-bold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
        </div>
      </div>

      {/* Minimum order warning */}
      {belowMinimum && (
        <div className="mt-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-300">
            Minimum order value is {formatCurrency(config.minimumOrderValue)}. Add {formatCurrency(config.minimumOrderValue - subtotal)} more to place order.
          </p>
        </div>
      )}

      {/* Cart Items */}
      <div className="mt-3 overflow-hidden rounded-[1.35rem] bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.55)] divide-y divide-slate-50 dark:divide-slate-800">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const price = item.discountPrice ?? item.price;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: removingId === item.id ? 0 : 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-sm border-2 border-emerald-500 flex items-center justify-center shrink-0">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.unit || "per item"}</p>
                  </div>

                  <div className="flex h-[30px] shrink-0 items-center overflow-hidden rounded-full bg-black">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-full flex items-center justify-center text-white press"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-[12px] font-bold text-white">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-full flex items-center justify-center text-white press"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-[60px]">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">{formatCurrency(price * item.quantity)}</p>
                    {item.discountPrice && (
                      <p className="text-[10px] text-slate-400 line-through">{formatCurrency(item.price * item.quantity)}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors press shrink-0"
                  >
                    <Trash2 className="h-3 w-3 text-slate-300 hover:text-red-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Coupon Section */}
      <div className="mt-3 rounded-[1.35rem] bg-white p-3.5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-400 shrink-0" />
          {promoApplied ? (
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-emerald-600">Code applied: {promoCode.toUpperCase()}</p>
                <p className="text-[10px] text-slate-400">{promoDescription} &mdash; You save {formatCurrency(promoDiscount)}</p>
              </div>
              <button type="button" onClick={removePromo} className="text-[11px] font-semibold text-red-500 press">Remove</button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                  placeholder="Apply coupon code"
                  className="flex-1 h-9 bg-transparent text-[13px] font-medium text-slate-800 dark:text-white outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={promoLoading}
                  className="text-[12px] font-bold text-primary press disabled:opacity-50"
                >
                  {promoLoading ? "..." : "Apply"}
                </button>
              </div>
              {promoError && <p className="text-[10px] text-red-500 mt-1">{promoError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Bill Details */}
      <div className="mt-3 rounded-[1.35rem] bg-white p-4 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] dark:bg-slate-900">
        <h2 className="text-[13px] font-bold text-slate-900 dark:text-white mb-3">Bill Details</h2>
        <div className="space-y-2.5 text-[12px]">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Item total</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(subtotal)}</span>
          </div>
          {gstRate > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">GST ({gstRate}% inclusive)</span>
              <span className="font-medium text-slate-500 dark:text-slate-400">{formatCurrency(gstAmount)}</span>
            </div>
          )}
          {promoApplied && (
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Coupon discount</span>
              <span className="font-medium text-emerald-600">-{formatCurrency(promoDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Delivery fee</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {qualifiesFreeDelivery ? <span className="text-emerald-600">FREE</span> : <span>Calculated at checkout</span>}
            </span>
          </div>
          {qualifiesFreeDelivery && (
            <p className="text-[10px] text-emerald-600 -mt-1">Free delivery on orders above {formatCurrency(config.freeDeliveryThreshold)}</p>
          )}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex justify-between">
            <span className="font-bold text-slate-900 dark:text-white">Cart total</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</span>
          </div>
          {gstRate > 0 && (
            <p className="text-[10px] text-slate-400">Prices are inclusive of {gstRate}% GST{config.gstin ? ` (GSTIN: ${config.gstin})` : ""}</p>
          )}
        </div>
        {totalSavings > 0 && (
          <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-3 py-2">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              You&apos;re saving {formatCurrency(totalSavings)} on this order!
            </p>
          </div>
        )}
      </div>

      {/* Fixed bottom checkout button */}
      <div className="ios-floating-action md:relative md:bottom-0 md:left-auto md:right-auto md:mt-5 md:p-0">
        <Link
          href={belowMinimum ? "#" : "/checkout"}
          onClick={(e) => { if (belowMinimum) e.preventDefault(); }}
          className={`mx-auto flex h-[54px] max-w-md items-center justify-between rounded-2xl px-5 shadow-[0_20px_45px_-24px_rgba(0,0,0,0.85)] press ${belowMinimum ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed" : "bg-black text-white"}`}
        >
          <div>
            <p className="text-[14px] font-bold">{belowMinimum ? "Add more items" : "Proceed to Checkout"}</p>
            <p className="text-[10px] text-white/70">{items.length} item{items.length > 1 ? "s" : ""}</p>
          </div>
          <span className="text-[16px] font-bold">{formatCurrency(totalAmount)}</span>
        </Link>
      </div>
    </main>
  );
}
