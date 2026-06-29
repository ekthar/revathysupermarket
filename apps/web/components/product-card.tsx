"use client";

import Link from "next/link";
import { Clock, Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback } from "react";
import { useCartItem, useCartActions } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/product-image";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorite-button";
import { tapScale, springPresets } from "@/lib/motion";
import { useRoutePreload } from "@/lib/hooks/use-preload";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  horizontal?: boolean;
}

// Memoized product card - only re-renders when product prop changes
export const ProductCard = memo(function ProductCard({ product, compact = false, horizontal = false }: ProductCardProps) {
  const price = product.discountPrice ?? product.price;
  const outOfStock = product.stock <= 0;
  const productHref = `/products/${product.slug}`;
  
  // Preload product detail page on hover/touch intent
  const preload = useRoutePreload(productHref);

  // Horizontal list layout
  if (horizontal) {
    return (
      <motion.article
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -2 }}
        transition={springPresets.snappy}
        className={cn(
          "product-list-card hover-lift",
          outOfStock && "opacity-50"
        )}
      >
        <Link href={productHref} className="shrink-0" onMouseEnter={preload.onMouseEnter} onTouchStart={preload.onTouchStart}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="h-16 w-16 rounded-xl overflow-hidden bg-neutral-50"
          >
            <ProductImage src={product.image} alt={product.name} className="object-cover" />
          </motion.div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={productHref} onMouseEnter={preload.onMouseEnter} onTouchStart={preload.onTouchStart}>
            <h3 className="text-body font-bold text-neutral-800 leading-snug line-clamp-1">
              {product.name}
            </h3>
            <p className="text-micro text-neutral-400 mt-0.5 font-medium">{product.unit || "Fresh pick"}</p>
          </Link>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-title font-black text-neutral-900">{formatCurrency(price)}</span>
            <span className="text-micro text-neutral-400 font-medium">/ {product.unit || "per kg"}</span>
          </div>
        </div>

        <div className="shrink-0">
          <CartControls product={product} outOfStock={outOfStock} variant="horizontal" />
        </div>
      </motion.article>
    );
  }

  // Grid / Compact card layout
  return (
    <motion.article
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -3 }}
      transition={springPresets.snappy}
      className={cn(
        "relative overflow-hidden rounded-lg bg-white shadow-elevation-2 dark:bg-neutral-900 product-card-animated",
        outOfStock && "opacity-50"
      )}
    >
      <Link href={productHref} onMouseEnter={preload.onMouseEnter} onTouchStart={preload.onTouchStart}>
        <div className={cn(
          "relative bg-neutral-50 overflow-hidden",
          compact ? "aspect-square rounded-t-2xl" : "aspect-[4/3.2] rounded-t-2xl"
        )}>
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full w-full"
          >
            <ProductImage src={product.image} alt={product.name} className="object-cover" />
          </motion.div>
          {product.discountPrice && (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black px-2 py-1 text-micro font-black text-white shadow-md">
              <Clock className="h-2.5 w-2.5" />
              {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-neutral-900/90 text-white text-micro font-semibold px-2.5 py-1 rounded-full">Sold out</span>
            </div>
          )}
          {/* Favorite button */}
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton productId={product.id} size="sm" />
          </div>
        </div>
      </Link>

      <div className={cn("p-3", compact && "p-2.5")}>
        <Link href={productHref} onMouseEnter={preload.onMouseEnter} onTouchStart={preload.onTouchStart}>
          <h3 className={cn(
            "font-semibold text-neutral-800 leading-snug line-clamp-2",
            compact ? "text-caption" : "text-caption"
          )}>{product.name}</h3>
          <p className="text-micro text-neutral-400 mt-0.5 font-medium">{product.unit || "Fresh pack"}</p>
        </Link>

        <div className="flex items-end justify-between mt-2.5 gap-1">
          <div>
            <span className={cn("font-black text-neutral-900", compact ? "text-body" : "text-title")}>{formatCurrency(price)}</span>
            <span className="text-micro text-neutral-400 ml-0.5 font-medium">/ {product.unit || "per kg"}</span>
            {product.discountPrice && (
              <span className="ml-1.5 text-micro text-neutral-400 line-through">{formatCurrency(product.price)}</span>
            )}
          </div>

          {/* Cart control - isolated to prevent parent re-render */}
          <CartControls product={product} outOfStock={outOfStock} variant="grid" />
        </div>
      </div>
    </motion.article>
  );
});

// Isolated cart controls component - only this re-renders on cart changes
function CartControls({ product, outOfStock, variant }: { product: Product; outOfStock: boolean; variant: "grid" | "horizontal" }) {
  const cartItem = useCartItem(product.id);
  const { addItem, updateQuantity } = useCartActions();
  const { showToast } = useToast();

  const handleAdd = useCallback(() => {
    if (outOfStock) return;
    addItem(product);
    // Haptic feedback on mobile - non-blocking
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    showToast(`Added ${product.name}`, "success");
  }, [outOfStock, addItem, product, showToast]);

  const handleIncrement = useCallback(() => {
    if (cartItem) updateQuantity(product.id, cartItem.quantity + 1);
  }, [cartItem, updateQuantity, product.id]);

  const handleDecrement = useCallback(() => {
    if (cartItem) updateQuantity(product.id, cartItem.quantity - 1);
  }, [cartItem, updateQuantity, product.id]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {cartItem ? (
        <QuantityStepper
          key="qty"
          quantity={cartItem.quantity}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          vertical={variant === "horizontal"}
        />
      ) : (
        <motion.button
          key="add"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          whileTap={tapScale.primary}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          type="button"
          disabled={outOfStock}
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
          className={variant === "horizontal"
            ? "flex items-center gap-1 rounded-full bg-black px-3 py-2 text-caption font-black text-white hover:bg-neutral-800 active:bg-neutral-700 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            : "flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black text-white hover:bg-neutral-800 active:bg-neutral-700 shadow-elevation-3 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          }
        >
          <Plus className="h-4 w-4" />
          {variant === "horizontal" && "Add to Cart"}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// Animated quantity stepper with number bounce
const QuantityStepper = memo(function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  vertical = false
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  vertical?: boolean;
}) {
  if (vertical) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="flex flex-col items-center h-[72px] w-[32px] rounded-full bg-black overflow-hidden shadow-sm"
      >
        <motion.button
          type="button"
          onClick={onIncrement}
          whileTap={{ scale: 1.3 }}
          aria-label="Increase quantity"
          className="flex-1 w-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </motion.button>
        <motion.span
          key={quantity}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="text-caption font-bold text-white"
          aria-label={`Quantity: ${quantity}`}
        >
          {quantity}
        </motion.span>
        <motion.button
          type="button"
          onClick={onDecrement}
          whileTap={{ scale: 1.3 }}
          aria-label="Decrease quantity"
          className="flex-1 w-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <Minus className="h-3 w-3" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex h-[30px] items-center overflow-hidden rounded-full bg-black shadow-sm"
    >
      <motion.button
        type="button"
        onClick={onDecrement}
        whileTap={{ scale: 1.4 }}
        aria-label="Decrease quantity"
        className="w-7 h-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
      >
        <Minus className="h-3 w-3" />
      </motion.button>
      <motion.span
        key={quantity}
        initial={{ scale: 1.5, opacity: 0, y: -5 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="w-5 text-center text-caption font-bold text-white"
        aria-label={`Quantity: ${quantity}`}
      >
        {quantity}
      </motion.span>
      <motion.button
        type="button"
        onClick={onIncrement}
        whileTap={{ scale: 1.4 }}
        aria-label="Increase quantity"
        className="w-7 h-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
      >
        <Plus className="h-3 w-3" />
      </motion.button>
    </motion.div>
  );
});
