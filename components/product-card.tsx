"use client";

import Link from "next/link";
import { Bell, Minus, Plus, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/product-image";
import { useToast } from "@/components/toast-provider";

export function ProductCard({ product }: { product: Product }) {
  const { addItem, items, updateQuantity } = useCart();
  const { showToast } = useToast();
  const price = product.discountPrice ?? product.price;
  const cartItem = items.find((item) => item.id === product.id);

  function add() {
    if (product.stock <= 0) return;
    addItem(product);
    showToast(`${product.name} added to cart`, "success");
  }

  function notifyMe() {
    showToast(`We'll notify you when ${product.name} is back in stock`, "success");
  }

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className={product.stock <= 0 ? "group overflow-hidden rounded-[1.45rem] border border-white/70 bg-card/95 opacity-75 grayscale shadow-[0_18px_50px_-34px_rgba(15,23,42,0.7)] transition dark:border-white/10" : "group overflow-hidden rounded-[1.45rem] border border-white/70 bg-card/95 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.7)] transition dark:border-white/10"}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[1.08] overflow-hidden bg-muted sm:aspect-[4/3]">
          <ProductImage src={product.image} alt={product.name} className="transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/45 to-transparent" />
          {product.discountPrice && (
            <Badge className="absolute left-2.5 top-2.5 bg-lime-fresh px-2 py-0.5 text-[10px] text-slate-950 sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs">
              Offer
            </Badge>
          )}
        </div>
      </Link>
      <div className="space-y-3 p-3 sm:p-4">
        <div>
          <p className="truncate text-[10px] font-black uppercase text-primary sm:text-xs">{product.category}</p>
          <Link href={`/products/${product.slug}`} className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 hover:text-primary sm:text-base">
            {product.name}
          </Link>
          <p className="text-xs font-semibold text-muted-foreground sm:text-sm">{product.unit}</p>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <span className="block text-base font-black leading-none sm:text-lg">{formatCurrency(price)}</span>
            {product.discountPrice && (
              <span className="mt-1 block text-xs text-muted-foreground line-through sm:text-sm">
                {formatCurrency(product.price)}
              </span>
            )}
            <p className={product.stock > 0 ? "mt-1 text-[11px] font-bold text-primary" : "mt-1 text-[11px] font-bold text-red-500"}>
              {product.stock > 0 ? "In stock" : "Out of stock"}
            </p>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {cartItem ? (
              <motion.div
                key="quantity"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="flex h-10 shrink-0 items-center overflow-hidden rounded-2xl border border-primary/20 bg-primary text-white shadow-[0_14px_28px_-18px_rgba(15,138,95,0.9)] sm:h-11"
              >
                <button
                  type="button"
                  className="flex h-full w-9 items-center justify-center active:bg-black/10"
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                  title={`Reduce ${product.name}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-6 text-center text-sm font-black">{cartItem.quantity}</span>
                <button
                  type="button"
                  className="flex h-full w-9 items-center justify-center active:bg-black/10"
                  onClick={() => {
                    updateQuantity(product.id, cartItem.quantity + 1);
                    showToast("Quantity updated", "success");
                  }}
                  title={`Add one more ${product.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <Button
                key="add"
                size="icon"
                disabled={product.stock <= 0}
                onClick={add}
                title={`Add ${product.name}`}
                className="h-10 w-10 shrink-0 rounded-2xl sm:h-11 sm:w-11"
              >
                <Plus className="h-4 w-4 sm:hidden" />
                <ShoppingCart className="hidden h-4 w-4 sm:block" />
              </Button>
            )}
          </AnimatePresence>
          {product.stock <= 0 ? (
            <Button type="button" size="icon" variant="outline" onClick={notifyMe} title={`Notify me about ${product.name}`} className="h-10 w-10 shrink-0 rounded-2xl sm:h-11 sm:w-11">
              <Bell className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
