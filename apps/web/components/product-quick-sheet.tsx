"use client";

import { memo, useCallback, useState } from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import { Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { springs, tapScale } from "@/lib/motion";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-provider";
import { ProductImage } from "@/components/product-image";
import { haptic } from "@/lib/haptics";
import type { Product } from "@/lib/types";

/**
 * ProductQuickSheet — Uber Eats-style bottom sheet for product details.
 *
 * Opens on mobile when tapping a product card, showing essential info
 * without navigating away from the current page. Preserves scroll position
 * and feels like a native modal card.
 *
 * Features:
 * - Draggable bottom sheet (vaul)
 * - Product image, name, price, description
 * - Add-to-cart with quantity stepper
 * - "View full details" link to the actual product page
 * - Haptic feedback on add/quantity change
 */
export const ProductQuickSheet = memo(function ProductQuickSheet({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!product) return null;

  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[91] bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[92] max-h-[88dvh] rounded-t-3xl bg-white dark:bg-neutral-900 shadow-2xl outline-none">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <Drawer.Title className="sr-only">{product.name}</Drawer.Title>

          {/* Content */}
          <div className="overflow-y-auto overscroll-contain px-4 pb-[calc(5rem+var(--safe-bottom,0px))]">
            {/* Image */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-50 dark:bg-neutral-800 mt-1">
              <ProductImage src={product.image} alt={product.name} className="object-cover" />
              {product.discountPrice && (
                <span className="absolute top-3 left-3 rounded-lg bg-neutral-900/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold text-white">
                  {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Info */}
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white leading-snug">{product.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {product.unit && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{product.unit}</span>
                    )}
                    {product.avgRating && product.avgRating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">{product.avgRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-neutral-900 dark:text-white">{formatCurrency(product.discountPrice ?? product.price)}</span>
                  {product.discountPrice && (
                    <span className="block text-xs text-neutral-400 line-through">{formatCurrency(product.price)}</span>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}

              {/* View full details link */}
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="mt-3 inline-flex text-xs font-semibold text-neutral-900 dark:text-white underline underline-offset-2"
              >
                View full details
              </Link>
            </div>

            {/* Add to cart section */}
            <div className="mt-5 pb-4">
              <SheetCartControls product={product} onClose={onClose} />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

// ─── Sheet Cart Controls ──────────────────────────────────────────────────────
function SheetCartControls({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem, items, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.id === product.id);
  const price = product.discountPrice ?? product.price;
  const outOfStock = product.stock <= 0;

  const handleAdd = useCallback(() => {
    if (outOfStock) return;
    addItem(product);
    haptic("medium");
  }, [outOfStock, addItem, product]);

  return (
    <AnimatePresence mode="wait">
      {cartItem ? (
        <motion.div
          key="qty"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.enter}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center h-12 rounded-full bg-neutral-900 dark:bg-white overflow-hidden">
            <motion.button
              type="button"
              onClick={() => { updateQuantity(product.id, cartItem.quantity - 1); haptic("light"); }}
              whileTap={{ scale: 1.3 }}
              transition={springs.tap}
              className="w-12 h-full flex items-center justify-center text-white dark:text-neutral-900 press"
              aria-label="Decrease"
            >
              <Minus className="h-4 w-4" />
            </motion.button>
            <motion.span
              key={cartItem.quantity}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springs.tap}
              className="w-8 text-center text-sm font-bold text-white dark:text-neutral-900 tabular-nums"
            >
              {cartItem.quantity}
            </motion.span>
            <motion.button
              type="button"
              onClick={() => { updateQuantity(product.id, cartItem.quantity + 1); haptic("light"); }}
              whileTap={{ scale: 1.3 }}
              transition={springs.tap}
              disabled={cartItem.quantity >= product.stock}
              className="w-12 h-full flex items-center justify-center text-white dark:text-neutral-900 press disabled:opacity-30"
              aria-label="Increase"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          </div>
          <Link
            href="/cart"
            onClick={onClose}
            className="flex-1 h-12 flex items-center justify-center rounded-full bg-secondary-600 text-white text-sm font-bold press"
          >
            View cart · {formatCurrency(price * cartItem.quantity)}
          </Link>
        </motion.div>
      ) : (
        <motion.button
          key="add"
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.enter}
          whileTap={tapScale.primary}
          onClick={handleAdd}
          disabled={outOfStock}
          className="flex items-center justify-center gap-2 h-12 w-full rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm disabled:opacity-40 press shadow-lg"
        >
          <ShoppingBag className="h-4 w-4" />
          {outOfStock ? "Out of stock" : `Add to cart · ${formatCurrency(price)}`}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
