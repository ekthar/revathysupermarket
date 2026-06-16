"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";

export function CartPageClient() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-4xl font-black">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Fresh groceries are waiting in the aisles.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Start shopping</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Review order</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Cart</h1>
        <p className="mt-2 text-sm text-muted-foreground">{items.length} items ready for checkout</p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <article key={item.id} className="grid grid-cols-[92px_1fr] gap-3 rounded-[1.5rem] border border-white/70 bg-card/95 p-3 shadow-soft dark:border-white/10 sm:grid-cols-[120px_1fr_auto] sm:gap-4 sm:p-4">
              <div className="relative aspect-square overflow-hidden rounded-[1.15rem] bg-muted">
                <ProductImage src={item.image} alt={item.name} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase text-primary sm:text-xs">{item.category}</p>
                <h2 className="mt-1 line-clamp-2 font-black leading-5">{item.name}</h2>
                <p className="text-xs font-semibold text-muted-foreground sm:text-sm">{item.unit}</p>
                <p className="mt-2 font-black">{formatCurrency(item.discountPrice ?? item.price)}</p>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:flex-col sm:justify-between">
                <div className="flex h-11 items-center rounded-2xl border border-border bg-background/70">
                  <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} title="Decrease quantity">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-9 text-center font-black">{item.quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} title="Increase quantity">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="icon" onClick={() => removeItem(item.id)} title="Remove item" className="rounded-2xl">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </section>
        <aside className="sticky bottom-24 h-fit rounded-[1.75rem] border border-white/70 bg-card/95 p-5 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.75)] dark:border-white/10 lg:top-24">
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
