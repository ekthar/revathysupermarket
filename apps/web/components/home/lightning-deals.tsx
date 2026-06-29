"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Zap, Clock, Plus, Minus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { useCartItem, useCartActions } from "@/components/cart/cart-provider";
import { useToast } from "@/components/toast-provider";
import type { Product } from "@/lib/types";

interface LightningDeal {
  product: Product;
  discountPercent: number;
  /** Stock sold percentage (0-100) — drives urgency bar */
  stockSoldPercent: number;
  /** When this deal expires */
  expiresAt?: string | null;
}

interface LightningDealsProps {
  deals: LightningDeal[];
}

/**
 * Lightning Deals Rail — Blinkit/Zepto/Swiggy Instamart style
 * 
 * Features:
 * - Horizontal scroll snap carousel
 * - Each card has: product image, discount badge, price, stock progress bar
 * - Urgency: bar turns red when > 80% sold, "Almost Gone!" label
 * - Live countdown per deal (if expiresAt is set)
 * - Quick add-to-cart button inline
 * - "SOLD OUT" overlay when stock = 0
 */
export function LightningDeals({ deals }: LightningDealsProps) {
  if (deals.length === 0) return null;

  return (
    <section className="pt-6 pb-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 md:max-w-7xl md:mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Zap className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" fill="currentColor" />
          </div>
          <div>
            <h2 className="text-title font-black text-foreground leading-none">Lightning Deals</h2>
            <p className="text-micro text-muted-foreground mt-0.5">Limited time, limited stock</p>
          </div>
        </div>
        <Link
          href="/offers"
          className="flex items-center gap-1 text-caption font-bold text-primary hover:underline"
        >
          See All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Horizontal scroll rail */}
      <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar scroll-x px-4 md:px-6 lg:px-8 md:max-w-7xl md:mx-auto pb-2">
        {deals.map((deal, i) => (
          <DealCard key={deal.product.id} deal={deal} index={i} />
        ))}
      </div>
    </section>
  );
}

// ─── Individual Deal Card ────────────────────────────────────────────────────

function DealCard({ deal, index }: { deal: LightningDeal; index: number }) {
  const { product, discountPercent, stockSoldPercent, expiresAt } = deal;
  const outOfStock = product.stock <= 0;
  const almostGone = stockSoldPercent >= 80;
  const price = product.discountPrice ?? product.price;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "relative flex-shrink-0 w-[155px] sm:w-[170px] rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden shadow-elevation-1 border border-neutral-100 dark:border-neutral-800",
        outOfStock && "opacity-60"
      )}
    >
      {/* Discount badge — top left */}
      <div className="absolute top-2 left-2 z-10">
        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-red-500 text-white text-micro font-black shadow-sm">
          <Zap className="h-2.5 w-2.5" fill="currentColor" />
          {discountPercent}% OFF
        </span>
      </div>

      {/* Product image */}
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-neutral-50 dark:bg-neutral-800">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="170px"
            className="object-cover p-2"
            loading="lazy"
          />
          {outOfStock && (
            <div className="absolute inset-0 bg-white/80 dark:bg-black/70 flex items-center justify-center">
              <span className="px-3 py-1 rounded-full bg-neutral-900 text-white text-micro font-bold -rotate-12 shadow-md">
                SOLD OUT
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Card body */}
      <div className="p-2.5 space-y-2">
        {/* Product name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-caption font-semibold text-foreground line-clamp-2 leading-tight min-h-[2.4em]">
            {product.name}
          </h3>
        </Link>

        {/* Unit */}
        <p className="text-micro text-muted-foreground">{product.unit}</p>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-body font-black text-foreground">{formatCurrency(price)}</span>
          {product.discountPrice && (
            <span className="text-micro text-muted-foreground line-through">{formatCurrency(product.price)}</span>
          )}
        </div>

        {/* Stock progress bar */}
        <StockBar soldPercent={stockSoldPercent} almostGone={almostGone} />

        {/* Countdown (if applicable) */}
        {expiresAt && <DealCountdown endsAt={expiresAt} />}

        {/* Add to cart */}
        <QuickAddButton product={product} outOfStock={outOfStock} />
      </div>
    </motion.article>
  );
}

// ─── Stock Progress Bar ──────────────────────────────────────────────────────

function StockBar({ soldPercent, almostGone }: { soldPercent: number; almostGone: boolean }) {
  return (
    <div className="space-y-0.5">
      <div className="relative h-[5px] w-full rounded-full bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(soldPercent, 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            almostGone
              ? "bg-gradient-to-r from-red-500 to-orange-400"
              : "bg-gradient-to-r from-green-500 to-emerald-400"
          )}
        />
      </div>
      <p className={cn(
        "text-[9px] font-bold leading-none",
        almostGone ? "text-red-500" : "text-muted-foreground"
      )}>
        {almostGone ? "Almost Gone!" : `${soldPercent}% sold`}
      </p>
    </div>
  );
}

// ─── Deal Countdown ──────────────────────────────────────────────────────────

function DealCountdown({ endsAt }: { endsAt: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setText("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setText(h > 0 ? `${h}h ${m}m left` : `${m}m left`);
    };
    tick();
    const id = setInterval(tick, 30000); // update every 30s (not per-second to reduce renders)
    return () => clearInterval(id);
  }, [endsAt]);

  if (!text || text === "Ended") return null;

  return (
    <span className="flex items-center gap-1 text-[9px] font-bold text-orange-600 dark:text-orange-400">
      <Clock className="h-2.5 w-2.5" />
      {text}
    </span>
  );
}

// ─── Quick Add Button ────────────────────────────────────────────────────────

function QuickAddButton({ product, outOfStock }: { product: Product; outOfStock: boolean }) {
  const cartItem = useCartItem(product.id);
  const { addItem, updateQuantity } = useCartActions();
  const { showToast } = useToast();

  const handleAdd = useCallback(() => {
    if (outOfStock) return;
    addItem(product);
    if ("vibrate" in navigator) navigator.vibrate(10);
    showToast(`Added ${product.name}`, "success");
  }, [outOfStock, addItem, product, showToast]);

  if (outOfStock) {
    return (
      <button
        disabled
        className="w-full h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-micro font-bold text-muted-foreground cursor-not-allowed"
      >
        Out of Stock
      </button>
    );
  }

  if (cartItem) {
    return (
      <div className="flex items-center justify-between h-8 rounded-lg bg-primary overflow-hidden">
        <button
          type="button"
          onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
          className="h-full w-8 flex items-center justify-center text-white hover:bg-white/10"
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="text-caption font-bold text-white tabular-nums">{cartItem.quantity}</span>
        <button
          type="button"
          onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
          className="h-full w-8 flex items-center justify-center text-white hover:bg-white/10"
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="w-full h-8 rounded-lg border-2 border-primary bg-primary/5 text-primary text-caption font-bold hover:bg-primary/10 active:scale-95 transition-all"
      aria-label={`Add ${product.name} to cart`}
    >
      ADD
    </button>
  );
}
