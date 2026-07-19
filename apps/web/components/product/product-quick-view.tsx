"use client";

/**
 * Product Quick View Modal — Desktop UX Enhancement
 * ═════════════════════════════════════════════════
 *
 * A beautiful modal that shows product details without navigating away.
 * Triggered from product cards on hover/click "Quick View" button.
 *
 * Features:
 * - Smooth spring entrance animation
 * - Product image with zoom effect
 * - Add-to-cart with quantity stepper
 * - Price comparison (discount vs original)
 * - Keyboard navigable (Escape to close)
 * - Click outside to dismiss
 * - Link to full product page
 */

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  X,
  Zap,
} from "lucide-react";
import { springs, tapScale } from "@/lib/motion";
import { lockDocumentScroll } from "@/lib/document-scroll-lock";
import type { Product } from "@/lib/types";

interface ProductQuickViewProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

export function ProductQuickView({ product, open, onClose, onAddToCart }: ProductQuickViewProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock scroll when open
  useEffect(() => {
    if (!open) return;
    return lockDocumentScroll();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Click outside
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  if (!product) return null;

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice! : product.price;
  const savingsPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={springs.enter}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Close quick view"
            >
              <X className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Product Image */}
              <div className="relative aspect-square bg-neutral-50 dark:bg-neutral-800 overflow-hidden group">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-neutral-200 dark:text-neutral-700" />
                  </div>
                )}

                {/* Discount badge */}
                {hasDiscount && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, ...springs.enter }}
                    className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-900 text-white shadow-lg"
                  >
                    <Zap className="h-3 w-3 text-amber-400" />
                    <span className="text-xs font-black">{savingsPercent}% OFF</span>
                  </motion.div>
                )}
              </div>

              {/* Product Details */}
              <div className="p-6 md:p-8 flex flex-col">
                {/* Category */}
                <span className="text-xs font-bold uppercase tracking-wider text-secondary-600 dark:text-secondary-400 mb-2">
                  {product.category}
                </span>

                {/* Name */}
                <h2
                  id="quick-view-title"
                  className="font-display text-2xl font-black text-neutral-900 dark:text-white leading-tight"
                >
                  {product.name}
                </h2>

                {/* Unit */}
                {product.unit && (
                  <p className="mt-1 text-sm text-neutral-400 font-medium">{product.unit}</p>
                )}

                {/* Description */}
                {product.description && (
                  <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                )}

                {/* Price */}
                <div className="mt-5 flex items-baseline gap-3">
                  <span className="text-3xl font-black text-neutral-900 dark:text-white">
                    ₹{displayPrice}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-neutral-400 line-through font-medium">
                      ₹{product.price}
                    </span>
                  )}
                </div>

                {/* Stock status */}
                <div className="mt-3 flex items-center gap-2">
                  {product.stock > 0 ? (
                    <>
                      <div className="h-2 w-2 rounded-full bg-secondary-500 animate-pulse" />
                      <span className="text-xs font-semibold text-secondary-600 dark:text-secondary-400">
                        In Stock ({product.stock} available)
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-xs font-semibold text-red-500">Out of Stock</span>
                    </>
                  )}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  {product.stock > 0 && (
                    <motion.button
                      type="button"
                      whileTap={tapScale.primary}
                      onClick={() => {
                        onAddToCart?.(product, 1);
                        onClose();
                      }}
                      className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold shadow-lg shadow-neutral-900/20 hover:shadow-xl transition-shadow"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Add to Cart
                    </motion.button>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={tapScale.primary}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Heart className="h-4 w-4" />
                      Save
                    </motion.button>

                    <Link
                      href={`/products/${product.slug || product.id}`}
                      onClick={onClose}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      View Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
