"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCartActions, useCartItem } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { Product } from "@/lib/types";

export function HomeSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const t = useTranslations("home");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [products, query]);

  return (
    <div className="sticky top-[56px] md:top-[70px] z-30 bg-card/98 backdrop-blur-md px-4 py-3">
      <div className="relative max-w-2xl mx-auto flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-neutral-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder={t("searchPlaceholder")}
            className="w-full h-11 rounded-full bg-muted border border-border pl-10 pr-8 text-body outline-none placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:shadow-sm transition-all"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 press">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter icon button */}
        <Link href="/products" aria-label="Open product filters" className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shrink-0 press">
          <SlidersHorizontal className="h-4 w-4" />
        </Link>

        <AnimatePresence>
          {focused && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-12 top-full mt-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-lg overflow-hidden z-50"
            >
              {results.map((p) => (
                <SearchResultItem key={p.id} product={p} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Individual search result item with cart controls
function SearchResultItem({ product }: { product: Product }) {
  const cartItem = useCartItem(product.id);
  const { addItem, updateQuantity } = useCartActions();

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  }, [addItem, product]);

  const handleIncrement = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) updateQuantity(product.id, cartItem.quantity + 1);
  }, [cartItem, updateQuantity, product.id]);

  const handleDecrement = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) updateQuantity(product.id, cartItem.quantity - 1);
  }, [cartItem, updateQuantity, product.id]);

  const price = product.discountPrice ?? product.price;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-neutral-50 dark:border-neutral-800 last:border-0 transition-colors">
      {/* Product image thumbnail */}
      <Link href={`/products/${product.slug}`} className="shrink-0">
        <div className="h-10 w-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        </div>
      </Link>

      {/* Product info */}
      <Link href={`/products/${product.slug}`} className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-bold text-neutral-900 dark:text-white">{formatCurrency(price)}</span>
          <span className="text-micro text-neutral-400 font-medium">{product.unit}</span>
        </div>
      </Link>

      {/* Cart controls */}
      <div className="shrink-0" onMouseDown={(e) => e.preventDefault()}>
        <AnimatePresence mode="wait" initial={false}>
          {cartItem ? (
            <motion.div
              key="qty"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex h-8 items-center overflow-hidden rounded-full bg-black"
            >
              <button
                type="button"
                onClick={handleDecrement}
                className="w-7 h-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-xs font-bold text-white">{cartItem.quantity}</span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-7 h-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="add"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              type="button"
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className="flex h-8 items-center gap-1 px-3 rounded-full bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="h-3 w-3" />
              Add
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
