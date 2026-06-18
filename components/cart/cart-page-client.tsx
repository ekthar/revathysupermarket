"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";

export function CartPageClient() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center">
        <ShoppingBag className="h-12 w-12 text-slate-200" />
        <h1 className="mt-4 text-lg font-bold text-slate-900">Your cart is empty</h1>
        <p className="mt-1 text-sm text-slate-500">Add items from the store to get started</p>
        <Link href="/products" className="mt-5 h-10 px-5 inline-flex items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white">
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-lg font-bold text-slate-900">Cart <span className="text-slate-400 font-normal text-sm">({items.length})</span></h1>

      {/* Items */}
      <div className="mt-3 divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-white">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-3 p-3"
            >
              <div className="h-14 w-14 shrink-0 rounded-md overflow-hidden bg-slate-50">
                <ProductImage src={item.image} alt={item.name} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-800 line-clamp-1">{item.name}</p>
                <p className="text-[11px] text-slate-400">{item.unit}</p>
                <p className="mt-1 text-[13px] font-bold text-slate-900">{formatCurrency((item.discountPrice ?? item.price) * item.quantity)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button type="button" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-0.5">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center h-7 rounded border border-primary/30 bg-primary/5">
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-full flex items-center justify-center text-primary">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-[11px] font-bold text-primary">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-full flex items-center justify-center text-primary">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bill */}
      <div className="mt-4 rounded-lg border border-slate-100 bg-white p-3">
        <h2 className="text-sm font-bold text-slate-900">Bill Details</h2>
        <div className="mt-2 space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Item total</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Delivery</span>
            <span className="text-xs text-primary font-medium">At checkout</span>
          </div>
          <div className="border-t border-dashed border-slate-100 pt-1.5 flex justify-between font-bold text-slate-900">
            <span>To Pay</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </div>

      {/* Checkout bar */}
      <div className="fixed bottom-14 inset-x-0 z-40 bg-white border-t border-slate-100 px-4 py-3 md:relative md:bottom-auto md:border-0 md:bg-transparent md:px-0 md:mt-4" style={{ marginBottom: "var(--safe-bottom)" }}>
        <Link
          href="/checkout"
          className="flex h-12 w-full items-center justify-between rounded-lg bg-primary px-5 text-white active:scale-[0.98] transition"
        >
          <div>
            <span className="text-sm font-bold">{formatCurrency(subtotal)}</span>
            <span className="ml-1 text-xs opacity-80">· {items.length} items</span>
          </div>
          <span className="text-sm font-semibold">Checkout →</span>
        </Link>
      </div>
    </main>
  );
}
