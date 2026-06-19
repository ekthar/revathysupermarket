"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Tag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";

export function CartPageClient() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const deliveryFee = subtotal > 500 ? 0 : 40;
  const promoDiscount = promoApplied ? Math.round(subtotal * 0.05) : 0;
  const tax = Math.round(subtotal * 0.02);
  const totalAmount = subtotal - promoDiscount + deliveryFee + tax;
  const totalSavings = items.reduce((sum, item) => {
    if (item.discountPrice) return sum + (item.price - item.discountPrice) * item.quantity;
    return sum;
  }, 0) + promoDiscount;

  function applyPromo() {
    if (promoCode.trim().length >= 4) setPromoApplied(true);
  }

  function handleRemove(id: string) {
    setRemovingId(id);
    setTimeout(() => { removeItem(id); setRemovingId(null); }, 180);
  }

  if (items.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[65dvh] px-6 text-center">
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
    <main className="max-w-2xl mx-auto px-4 pt-2 pb-36 md:pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md -mx-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/products" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 press">
              <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            </Link>
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 dark:text-white">Cart</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{items.length} item{items.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <span className="text-[14px] font-bold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
        </div>
      </div>

      {/* Cart Items - Swiggy minimal style (no images) */}
      <div className="mt-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
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
                  {/* Veg/Non-veg indicator dot */}
                  <div className="h-4 w-4 rounded-sm border-2 border-emerald-500 flex items-center justify-center shrink-0">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>

                  {/* Name + unit */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.unit || "per item"}</p>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center h-[30px] rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10 overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-full flex items-center justify-center text-primary press"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-[12px] font-bold text-primary">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-full flex items-center justify-center text-primary press"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0 min-w-[60px]">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">{formatCurrency(price * item.quantity)}</p>
                    {item.discountPrice && (
                      <p className="text-[10px] text-slate-400 line-through">{formatCurrency(item.price * item.quantity)}</p>
                    )}
                  </div>

                  {/* Remove */}
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
      <div className="mt-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-400 shrink-0" />
          {promoApplied ? (
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-emerald-600">Code applied: {promoCode}</p>
                <p className="text-[10px] text-slate-400">You save {formatCurrency(promoDiscount)}</p>
              </div>
              <button type="button" onClick={() => setPromoApplied(false)} className="text-[11px] font-semibold text-red-500 press">Remove</button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Apply coupon"
                className="flex-1 h-9 bg-transparent text-[13px] font-medium text-slate-800 dark:text-white outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={applyPromo}
                className="text-[12px] font-bold text-primary press"
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bill Details */}
      <div className="mt-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
        <h2 className="text-[13px] font-bold text-slate-900 dark:text-white mb-3">Bill Details</h2>
        <div className="space-y-2.5 text-[12px]">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Item total</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(subtotal)}</span>
          </div>
          {promoApplied && (
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Coupon discount</span>
              <span className="font-medium text-emerald-600">-{formatCurrency(promoDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Delivery fee</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {deliveryFee === 0 ? <span className="text-emerald-600">FREE</span> : formatCurrency(deliveryFee)}
            </span>
          </div>
          {deliveryFee === 0 && (
            <p className="text-[10px] text-emerald-600 -mt-1">Free delivery on orders above {formatCurrency(500)}</p>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Taxes & charges</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(tax)}</span>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex justify-between">
            <span className="font-bold text-slate-900 dark:text-white">To Pay</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</span>
          </div>
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
      <div className="fixed bottom-[60px] md:bottom-0 inset-x-0 z-40 p-4 md:relative md:mt-5 md:p-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md md:bg-transparent md:backdrop-blur-none border-t border-slate-100 dark:border-slate-800 md:border-0" style={{ paddingBottom: "var(--safe-bottom, 0px)" }}>
        <Link
          href="/checkout"
          className="flex h-[50px] w-full items-center justify-between rounded-xl bg-primary text-white shadow-md px-5 press"
        >
          <div>
            <p className="text-[14px] font-bold">Proceed to Checkout</p>
            <p className="text-[10px] text-white/70">{items.length} item{items.length > 1 ? "s" : ""}</p>
          </div>
          <span className="text-[16px] font-bold">{formatCurrency(totalAmount)}</span>
        </Link>
      </div>
    </main>
  );
}
