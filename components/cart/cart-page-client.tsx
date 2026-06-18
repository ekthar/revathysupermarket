"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";

export function CartPageClient() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[65dvh] px-6 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
          <ShoppingBag className="h-7 w-7 text-slate-300" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">Your cart is empty</h1>
        <p className="mt-1 text-sm text-slate-500">Add items from the store to get started</p>
        <Link href="/products" className="mt-5 h-11 px-6 inline-flex items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white press">
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 pt-4 pb-32 md:pb-6">
      {/* Header */}
      <h1 className="text-lg font-bold text-slate-900">
        Cart <span className="text-slate-400 font-normal text-sm ml-1">({items.length} items)</span>
      </h1>

      {/* Items */}
      <div className="mt-3 rounded-2xl overflow-hidden bg-white card-shadow">
        <AnimatePresence initial={false}>
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className={idx > 0 ? "border-t border-slate-100" : ""}
            >
              <div className="flex gap-3 p-3.5">
                {/* Image */}
                <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-50">
                  <ProductImage src={item.image} alt={item.name} />
                </div>

                {/* Info + controls */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-800 line-clamp-1 leading-snug">{item.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.unit}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[14px] font-bold text-slate-900">{formatCurrency((item.discountPrice ?? item.price) * item.quantity)}</p>

                    {/* Quantity stepper */}
                    <div className="flex items-center h-[30px] rounded-lg bg-primary overflow-hidden shadow-sm">
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-full flex items-center justify-center text-white active:bg-black/10">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-[12px] font-bold text-white">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-full flex items-center justify-center text-white active:bg-black/10">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button type="button" onClick={() => removeItem(item.id)} className="self-start mt-1 text-slate-300 hover:text-red-400 transition-colors p-0.5">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bill details */}
      <div className="mt-4 rounded-2xl bg-white card-shadow p-4">
        <h2 className="text-[13px] font-semibold text-slate-900">Bill Details</h2>
        <div className="mt-3 space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Item total</span>
            <span className="font-medium text-slate-700">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Delivery fee</span>
            <span className="text-[12px] font-medium text-primary">Confirmed at checkout</span>
          </div>
          <div className="border-t border-dashed border-slate-100 pt-2 flex justify-between">
            <span className="font-semibold text-slate-900">To Pay</span>
            <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </div>

      {/* Fixed checkout bar */}
      <div className="fixed bottom-[52px] md:bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 px-4 py-3" style={{ marginBottom: "var(--safe-bottom, 0px)" }}>
        <Link
          href="/checkout"
          className="flex h-[48px] w-full items-center justify-between rounded-xl bg-primary px-5 text-white press shadow-sm"
        >
          <div>
            <span className="text-[15px] font-bold">{formatCurrency(subtotal)}</span>
            <span className="ml-1.5 text-[12px] opacity-80">{items.length} items</span>
          </div>
          <span className="flex items-center gap-1 text-[13px] font-semibold">
            Checkout <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </main>
  );
}
