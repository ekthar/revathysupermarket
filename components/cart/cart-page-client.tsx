"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import type { CartItem } from "@/lib/types";

export function CartPageClient() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const [removedItem, setRemovedItem] = useState<CartItem | null>(null);
  const suggestions = products.filter((p) => !items.some((item) => item.id === p.id)).slice(0, 4);

  if (items.length === 0) {
    return (
      <main className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
          <ShoppingBag className="h-8 w-8 text-slate-400" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-900 dark:text-white">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500">Add items from the shop to get started.</p>
        <Button asChild className="mt-6 rounded-xl" size="lg">
          <Link href="/products">Browse Products</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Cart</h1>
        <p className="mt-0.5 text-sm text-slate-500">{items.length} {items.length === 1 ? "item" : "items"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items list */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-white/8 dark:bg-slate-900"
              >
                {/* Image */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5 sm:h-20 sm:w-20">
                  <ProductImage src={item.image} alt={item.name} />
                </div>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <h3 className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-white">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">{item.unit}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency((item.discountPrice ?? item.price) * item.quantity)}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    type="button"
                    onClick={() => { setRemovedItem(item); removeItem(item.id); }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-full w-8 items-center justify-center text-slate-600 active:bg-slate-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="min-w-6 text-center text-xs font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-full w-8 items-center justify-center text-slate-600 active:bg-slate-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary sidebar */}
        <aside className="h-fit rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-slate-900 lg:sticky lg:top-20">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Order Summary</h2>
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery</span>
              <span className="text-xs font-medium text-primary">Confirmed at checkout</span>
            </div>
            <hr className="border-slate-100 dark:border-white/5" />
            <div className="flex justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Total</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
            </div>
          </div>
          <Button asChild className="mt-5 w-full rounded-xl" size="lg">
            <Link href="/checkout">
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-3 text-center text-[11px] text-slate-400">COD or UPI on delivery</p>
        </aside>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">You might also like</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {suggestions.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </section>
      )}

      {/* Undo toast */}
      <AnimatePresence>
        {removedItem && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-sm items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg md:bottom-6"
            onAnimationComplete={() => {
              setTimeout(() => setRemovedItem(null), 3000);
            }}
          >
            <span className="text-sm font-medium">{removedItem.name} removed</span>
            <button
              type="button"
              onClick={() => {
                const item = removedItem;
                setRemovedItem(null);
                const { addItem } = useCart as unknown as { addItem: (item: CartItem, qty: number) => void };
                if (typeof addItem === "function") addItem(item, item.quantity);
              }}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
