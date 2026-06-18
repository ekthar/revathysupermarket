"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Minus, MoreVertical, Plus, ShoppingBag, Star, Tag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";

export function CartPageClient() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const deliveryFee = subtotal > 500 ? 0 : 40;
  const promoDiscount = promoApplied ? Math.round(subtotal * 0.05) : 0;
  const tax = Math.round(subtotal * 0.02);
  const totalAmount = subtotal - promoDiscount + deliveryFee + tax;

  function applyPromo() {
    if (promoCode.trim().length >= 4) {
      setPromoApplied(true);
    }
  }

  if (items.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[65dvh] px-6 text-center">
        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
          <ShoppingBag className="h-9 w-9 text-slate-300" />
        </div>
        <h1 className="mt-5 text-xl font-black text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500">Add items from the store to get started</p>
        <Link href="/products" className="mt-6 h-12 px-8 inline-flex items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white press shadow-lg">
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 pt-2 pb-32 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 press">
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Link>
          <h1 className="text-lg font-black text-slate-900">My Cart List</h1>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 press">
          <MoreVertical className="h-4 w-4 text-slate-700" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="mt-2 space-y-3">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-3.5 card-elevated"
            >
              <div className="flex gap-3">
                {/* Image */}
                <div className="h-[72px] w-[72px] shrink-0 rounded-xl overflow-hidden bg-slate-50">
                  <ProductImage src={item.image} alt={item.name} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          15-20 min
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                          4.9
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Price + quantity */}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[16px] font-black text-slate-900">
                      <span className="text-[12px] text-slate-400 font-medium mr-0.5">₹</span>
                      {((item.discountPrice ?? item.price) * item.quantity).toFixed(2)}
                    </p>

                    {/* Quantity stepper */}
                    <div className="flex items-center h-[32px] rounded-full bg-slate-100 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-full flex items-center justify-center text-slate-600 active:bg-slate-200"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-[12px] font-bold text-slate-900">{String(item.quantity).padStart(2, "0")}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-full flex items-center justify-center text-slate-600 active:bg-slate-200"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Promo Code Section */}
      <div className="mt-5 bg-white rounded-2xl p-4 card-elevated">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="flex-1 h-10 rounded-full bg-slate-50 border border-slate-100 px-4 text-[13px] font-medium outline-none placeholder:text-slate-400 focus:border-primary/40"
          />
          {promoApplied ? (
            <span className="shrink-0 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-[11px] font-bold text-orange-600">
              Promo-code Confirmed
            </span>
          ) : (
            <button
              type="button"
              onClick={applyPromo}
              className="shrink-0 h-10 px-4 rounded-full bg-slate-900 text-[12px] font-bold text-white press"
            >
              Apply
            </button>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="mt-5 bg-white rounded-2xl p-5 card-elevated">
        <h2 className="text-[15px] font-black text-slate-900">Order Summary</h2>
        <div className="mt-4 space-y-3 text-[13px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Order Amount</span>
            <span className="font-semibold text-slate-700">₹ {subtotal.toFixed(2)}</span>
          </div>
          {promoApplied && (
            <div className="flex justify-between">
              <span className="text-slate-500">Promo-code</span>
              <span className="font-semibold text-green-600">-₹ {promoDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Delivery</span>
            <span className="font-semibold text-slate-700">
              {deliveryFee === 0 ? (
                <span className="text-green-600">FREE</span>
              ) : (
                `₹ ${deliveryFee.toFixed(2)}`
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tax</span>
            <span className="font-semibold text-slate-700">₹ {tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between">
            <span className="font-black text-slate-900">Total Amount</span>
            <span className="font-black text-slate-900 text-[15px]">
              <span className="text-primary">₹</span> {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Proceed button - fixed on mobile */}
      <div className="fixed bottom-[60px] md:bottom-0 inset-x-0 z-40 p-4 md:relative md:mt-5 md:p-0" style={{ marginBottom: "var(--safe-bottom, 0px)" }}>
        <Link
          href="/checkout"
          className="flex h-[52px] w-full items-center justify-center rounded-full bg-slate-900 text-white press shadow-lg gap-2"
        >
          <span className="text-[14px] font-bold">Proceed Transactions</span>
        </Link>
      </div>
    </main>
  );
}
