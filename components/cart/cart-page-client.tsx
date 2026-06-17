"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import type { CartItem } from "@/lib/types";

export function CartPageClient() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const [removed, setRemoved] = useState<CartItem | null>(null);
  const suggestions = products.filter((product) => !items.some((item) => item.id === product.id)).slice(0, 4);

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center overflow-x-hidden px-4 text-center">
        <h1 className="font-display text-4xl font-black">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Fresh groceries are waiting in the aisles.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Start shopping</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl overflow-x-hidden px-4 pb-36 pt-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Review order</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Cart</h1>
        <p className="mt-2 text-sm text-muted-foreground">{items.length} items ready for checkout</p>
      </div>
      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-3 sm:space-y-4">
          {items.map((item) => (
            <motion.article
              key={item.id}
              drag="x"
              dragConstraints={{ left: -90, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) {
                  setRemoved(item);
                  removeItem(item.id);
                }
              }}
              className="grid min-w-0 grid-cols-[84px_minmax(0,1fr)] gap-3 rounded-[1.5rem] border border-white/70 bg-card/95 p-3 shadow-soft dark:border-white/10 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:gap-4 sm:p-4"
            >
              <div className="relative aspect-square overflow-hidden rounded-[1.15rem] bg-muted">
                <ProductImage src={item.image} alt={item.name} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase text-primary sm:text-xs">{item.category}</p>
                <h2 className="mt-1 line-clamp-2 font-black leading-5">{item.name}</h2>
                <p className="text-xs font-semibold text-muted-foreground sm:text-sm">{item.unit}</p>
                <p className="mt-2 font-black">{formatCurrency(item.discountPrice ?? item.price)}</p>
              </div>
              <div className="col-span-2 flex min-w-0 items-center justify-between gap-2 sm:col-span-1 sm:flex-col sm:justify-between">
                <div className="flex h-11 items-center rounded-2xl border border-border bg-background/70">
                  <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} title="Decrease quantity">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-9 text-center font-black">{item.quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} title="Increase quantity">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="icon" onClick={() => { setRemoved(item); removeItem(item.id); }} title="Remove item" className="rounded-2xl">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.article>
          ))}
          {suggestions.length > 0 ? (
            <section className="mt-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-black">You might also like</h2>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {suggestions.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </section>
          ) : null}
          {removed ? <UndoRemove item={removed} onClose={() => setRemoved(null)} /> : null}
        </section>
        <aside className="h-fit rounded-[1.75rem] border border-white/70 bg-card/95 p-5 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.75)] dark:border-white/10 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl font-bold">Order summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="font-bold">Confirmed by store</span>
            </div>
          </div>
          <p className="mt-5 rounded-2xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
            Delivery radius is verified at checkout using your saved store settings. Payment is collected by COD or UPI on delivery.
          </p>
          <Button asChild className="mt-5 w-full" size="lg">
            <Link href="/checkout">Checkout</Link>
          </Button>
        </aside>
      </div>
    </main>
  );
}

function UndoRemove({ item, onClose }: { item: CartItem; onClose: () => void }) {
  const { addItem } = useCart();
  return (
    <div className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-slate-950 p-3 text-sm font-black text-white shadow-premium">
      <span>{item.name} removed</span>
      <button type="button" onClick={() => { addItem(item, item.quantity); onClose(); }} className="rounded-xl bg-lime-fresh px-3 py-2 text-slate-950">Undo</button>
    </div>
  );
}
