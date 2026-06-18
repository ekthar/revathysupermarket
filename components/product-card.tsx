"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/product-image";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem, items, updateQuantity } = useCart();
  const { showToast } = useToast();
  const price = product.discountPrice ?? product.price;
  const cartItem = items.find((item) => item.id === product.id);
  const outOfStock = product.stock <= 0;

  function add() {
    if (outOfStock) return;
    addItem(product);
    showToast(`${product.name} added`, "success");
  }

  return (
    <article className={cn(
      "relative overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition active:scale-[0.98] dark:border-white/8 dark:bg-slate-900",
      outOfStock && "opacity-60"
    )}>
      <Link href={`/products/${product.slug}`} className="block">
        <div className={cn(
          "relative overflow-hidden bg-slate-100 dark:bg-white/5",
          compact ? "aspect-square" : "aspect-[4/3]"
        )}>
          <ProductImage src={product.image} alt={product.name} className="object-cover transition-transform duration-300 group-hover:scale-105" />
          {product.discountPrice && (
            <span className="absolute left-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
              Sale
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60">
              <span className="rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">Out of stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className={cn("p-2.5", compact ? "p-2" : "p-2.5 sm:p-3")}>
        <Link href={`/products/${product.slug}`}>
          <h3 className={cn(
            "line-clamp-2 font-semibold leading-tight text-slate-800 dark:text-white",
            compact ? "text-xs" : "text-[13px] sm:text-sm"
          )}>
            {product.name}
          </h3>
          <p className={cn("mt-0.5 text-slate-400", compact ? "text-[10px]" : "text-[11px]")}>
            {product.unit}
          </p>
        </Link>

        <div className="mt-2 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <span className={cn("font-bold text-slate-900 dark:text-white", compact ? "text-sm" : "text-sm sm:text-base")}>
              {formatCurrency(price)}
            </span>
            {product.discountPrice && (
              <span className="ml-1 text-[11px] text-slate-400 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* Add to cart / quantity control */}
          <AnimatePresence mode="wait" initial={false}>
            {cartItem ? (
              <motion.div
                key="qty"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex h-8 items-center overflow-hidden rounded-lg bg-primary text-white"
              >
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                  className="flex h-full w-7 items-center justify-center active:bg-black/10"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-5 text-center text-xs font-bold">{cartItem.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  className="flex h-full w-7 items-center justify-center active:bg-black/10"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="add" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <Button
                  size="sm"
                  disabled={outOfStock}
                  onClick={add}
                  className="h-8 rounded-lg px-3 text-xs font-bold"
                >
                  ADD
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}
