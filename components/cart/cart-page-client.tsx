"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Minus, MoreVertical, Plus, ShoppingBag, Star, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";

export function CartPageClient() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const deliveryFee = subtotal > 500 ? 0 : 40;
  const promoDiscount = promoApplied ? Math.round(subtotal * 0.05) : 0;
  const tax = Math.round(subtotal * 0.02);
  const totalAmount = subtotal - promoDiscount + deliveryFee + tax;

  function applyPromo() {
    if (promoCode.trim().length >= 4) {
      setPromoApplied(true);
    }
  }

  function handleRemove(id: string) {
    setRemovingId(id);
    setTimeout(() => {
      removeItem(id);
      setRemovingId(null);
    }, 200);
  }

  if (items.length === 0) {
    return (
      <motion.main
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="flex flex-col items-center justify-center min-h-[65dvh] px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center"
        >
          <ShoppingBag className="h-9 w-9 text-slate-300" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5 text-xl font-black text-slate-900 dark:text-white"
        >
          Your cart is empty
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-sm text-slate-500"
        >
          Add items from the store to get started
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/products" className="mt-6 h-12 px-8 inline-flex items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white press shadow-lg">
            Browse Products
          </Link>
        </motion.div>
      </motion.main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className="max-w-2xl mx-auto px-4 pt-2 pb-32 md:pb-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between py-3"
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 press">
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Link>
          <h1 className="text-lg font-black text-slate-900 dark:text-white">My Cart List</h1>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 press">
          <MoreVertical className="h-4 w-4 text-slate-700" />
        </button>
      </motion.div>

      {/* Cart Items with staggered entrance */}
      <div className="mt-2 space-y-3">
        <AnimatePresence initial={false}>
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{
                opacity: removingId === item.id ? 0 : 1,
                x: removingId === item.id ? -100 : 0,
                scale: removingId === item.id ? 0.9 : 1
              }}
              exit={{ opacity: 0, x: -100, height: 0, marginTop: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 card-elevated"
            >
              <div className="flex gap-3">
                {/* Image with hover zoom */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-[72px] w-[72px] shrink-0 rounded-xl overflow-hidden bg-slate-50"
                >
                  <ProductImage src={item.image} alt={item.name} />
                </motion.div>

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
                    <motion.button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      whileTap={{ scale: 0.7, rotate: -10 }}
                      className="text-slate-300 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>

                  {/* Price + quantity */}
                  <div className="flex items-center justify-between mt-3">
                    <motion.p
                      key={`price-${item.id}-${item.quantity}`}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-[16px] font-black text-slate-900 dark:text-white"
                    >
                      <span className="text-[12px] text-slate-400 font-medium mr-0.5">₹</span>
                      {((item.discountPrice ?? item.price) * item.quantity).toFixed(2)}
                    </motion.p>

                    {/* Quantity stepper with bounce */}
                    <div className="flex items-center h-[32px] rounded-full bg-slate-100 overflow-hidden">
                      <motion.button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        whileTap={{ scale: 1.3 }}
                        className="w-8 h-full flex items-center justify-center text-slate-600"
                      >
                        <Minus className="h-3 w-3" />
                      </motion.button>
                      <motion.span
                        key={item.quantity}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="w-7 text-center text-[12px] font-bold text-slate-900 dark:text-white"
                      >
                        {String(item.quantity).padStart(2, "0")}
                      </motion.span>
                      <motion.button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        whileTap={{ scale: 1.3 }}
                        className="w-8 h-full flex items-center justify-center text-slate-600"
                      >
                        <Plus className="h-3 w-3" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Promo Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-5 bg-white dark:bg-slate-900 rounded-2xl p-4 card-elevated"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="flex-1 h-10 rounded-full bg-slate-50 border border-slate-100 px-4 text-[13px] font-medium outline-none placeholder:text-slate-400 focus:border-primary/40 transition-all"
          />
          <AnimatePresence mode="wait">
            {promoApplied ? (
              <motion.span
                key="confirmed"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="shrink-0 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-[11px] font-bold text-orange-600"
              >
                Promo-code Confirmed
              </motion.span>
            ) : (
              <motion.button
                key="apply"
                type="button"
                onClick={applyPromo}
                whileTap={{ scale: 0.92 }}
                className="shrink-0 h-10 px-4 rounded-full bg-slate-900 text-[12px] font-bold text-white press"
              >
                Apply
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Order Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-5 bg-white dark:bg-slate-900 rounded-2xl p-5 card-elevated"
      >
        <h2 className="text-[15px] font-black text-slate-900 dark:text-white">Order Summary</h2>
        <div className="mt-4 space-y-3 text-[13px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Order Amount</span>
            <motion.span
              key={subtotal}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-semibold text-slate-700"
            >
              ₹ {subtotal.toFixed(2)}
            </motion.span>
          </div>
          <AnimatePresence>
            {promoApplied && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-between overflow-hidden"
              >
                <span className="text-slate-500">Promo-code</span>
                <span className="font-semibold text-green-600">-₹ {promoDiscount.toFixed(2)}</span>
              </motion.div>
            )}
          </AnimatePresence>
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
            <span className="font-black text-slate-900 dark:text-white">Total Amount</span>
            <motion.span
              key={totalAmount}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="font-black text-slate-900 text-[15px]"
            >
              <span className="text-primary">₹</span> {totalAmount.toFixed(2)}
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Proceed button - fixed on mobile */}
      <div className="fixed bottom-[60px] md:bottom-0 inset-x-0 z-40 p-4 md:relative md:mt-5 md:p-0" style={{ marginBottom: "var(--safe-bottom, 0px)" }}>
        <motion.div
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
        >
          <Link
            href="/checkout"
            className="flex h-[52px] w-full items-center justify-center rounded-full bg-slate-900 text-white shadow-lg gap-2"
          >
            <span className="text-[14px] font-bold">Proceed Transactions</span>
          </Link>
        </motion.div>
      </div>
    </motion.main>
  );
}
