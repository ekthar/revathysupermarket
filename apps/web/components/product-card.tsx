"use client";

import Link from "next/link";
import { Minus, Plus, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useRef } from "react";
import { useCartItem, useCartActions } from "@/components/cart/cart-provider";
import { useFlyToCart } from "@/components/ui/fly-to-cart";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/product-image";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";
import { FavoriteButton, type FavoriteButtonHandle } from "@/components/favorite-button";
import { DoubleTapHeart } from "@/components/ui/double-tap-heart";
import { tapScale, springs, durations, easings } from "@/lib/motion";
import { useRoutePreload } from "@/lib/hooks/use-preload";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  horizontal?: boolean;
  priority?: boolean;
}

// Memoized product card - only re-renders when product prop changes
export const ProductCard = memo(function ProductCard({ product, compact = false, horizontal = false, priority }: ProductCardProps) {
  const price = product.discountPrice ?? product.price;
  const outOfStock = product.stock <= 0;
  const productHref = `/products/${product.slug}`;
  
  // Preload product detail page on hover/touch intent
  const preload = useRoutePreload(productHref);
  const favoriteBtnRef = useRef<FavoriteButtonHandle>(null);

  // Horizontal list layout
  if (horizontal) {
    return (
      <motion.article
        whileTap={tapScale.gentle}
        transition={springs.snappy}
        className={cn(
          "product-list-card hover-lift",
          outOfStock && "opacity-50"
        )}
      >
        <Link
          href={productHref}
          className={cn("shrink-0", outOfStock && "pointer-events-none")}
          onMouseEnter={outOfStock ? undefined : preload.onMouseEnter}
          onTouchStart={outOfStock ? undefined : preload.onTouchStart}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="h-16 w-16 rounded-xl overflow-hidden bg-neutral-50"
          >
            <ProductImage src={product.image} alt={product.name} className="object-cover" priority={priority} />
          </motion.div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={productHref}
            className={cn(outOfStock && "pointer-events-none")}
            onMouseEnter={outOfStock ? undefined : preload.onMouseEnter}
            onTouchStart={outOfStock ? undefined : preload.onTouchStart}
          >
            <h3 className="text-body font-bold text-neutral-800 dark:text-neutral-100 leading-snug line-clamp-1">
              {product.name}
            </h3>
            <p className="text-micro text-neutral-400 mt-0.5 font-medium">{product.unit || "Fresh pick"}</p>
            {product.avgRating && product.avgRating > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-micro font-bold text-neutral-600 dark:text-neutral-400">{product.avgRating.toFixed(1)}</span>
                {product.reviewCount && product.reviewCount > 0 && (
                  <span className="text-micro text-neutral-400">({product.reviewCount})</span>
                )}
              </div>
            )}
          </Link>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-title font-black text-neutral-900 dark:text-white">{formatCurrency(price)}</span>
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
      whileTap={tapScale.subtle}
      transition={springs.snappy}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white border border-neutral-100 dark:bg-neutral-900 product-card-animated shadow-elevation-1",
        outOfStock && "opacity-50"
      )}
    >
      <Link
        href={productHref}
        className={cn(outOfStock && "pointer-events-none")}
        onMouseEnter={outOfStock ? undefined : preload.onMouseEnter}
        onTouchStart={outOfStock ? undefined : preload.onTouchStart}
      >
        <DoubleTapHeart onDoubleTap={() => favoriteBtnRef.current?.toggle()}>
          <div className={cn(
            "relative bg-neutral-50 overflow-hidden",
            compact ? "aspect-square rounded-t-2xl" : "aspect-[4/3.2] rounded-t-2xl"
          )}>
            <motion.div
              whileHover={{ scale: 1.08 }}
              transition={{ duration: durations.slow, ease: easings.easeOutQuart }}
              className="h-full w-full"
            >
              <ProductImage src={product.image} alt={product.name} className="object-cover" priority={priority} />
            </motion.div>
            {/* Unified badge: discount % + featured in one compact pill */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
              {(product.discountPrice || product.isFeatured) && (
                <span className="flex items-center gap-1 rounded-full bg-black px-2 py-1 text-micro font-bold text-white shadow-md">
                  {product.isFeatured && <Star className="h-2.5 w-2.5 fill-white" />}
                  {product.discountPrice
                    ? `${Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF`
                    : "Featured"}
                </span>
              )}
            </div>
            {/* Favorite button - always top-right */}
            <div className="absolute top-2 right-2 z-10">
              <FavoriteButton ref={favoriteBtnRef} productId={product.id} size="sm" />
            </div>
          </div>
        </DoubleTapHeart>
      </Link>

      {outOfStock && (
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-neutral-400" />
          <span className="text-micro font-semibold text-neutral-500">Out of stock</span>
        </div>
      )}
      <div className={cn("p-3", compact && "p-2.5")}>
        <Link
          href={productHref}
          className={cn(outOfStock && "pointer-events-none")}
          onMouseEnter={outOfStock ? undefined : preload.onMouseEnter}
          onTouchStart={outOfStock ? undefined : preload.onTouchStart}
        >
          <h3 className={cn(
            "font-semibold text-neutral-800 dark:text-neutral-100 leading-snug line-clamp-2",
            compact ? "text-caption" : "text-body"
          )}>{product.name}</h3>
          <p className="text-micro text-neutral-400 mt-0.5 font-medium">{product.unit || "Fresh pack"}</p>
          {product.avgRating && product.avgRating > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-micro font-bold text-neutral-600 dark:text-neutral-400">{product.avgRating.toFixed(1)}</span>
              {product.reviewCount && product.reviewCount > 0 && (
                <span className="text-micro text-neutral-400">({product.reviewCount})</span>
              )}
            </div>
          )}
        </Link>

        <div className="flex items-end justify-between mt-2.5 gap-1">
          <div>
            <span className={cn("font-black text-neutral-900 dark:text-white", compact ? "text-body" : "text-title")}>{formatCurrency(price)}</span>
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
  const { flyToCart } = useFlyToCart();

  const handleAdd = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (outOfStock) return;
    addItem(product);
    // Haptic feedback on mobile - non-blocking
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    flyToCart(product.image, e.currentTarget);
  }, [outOfStock, addItem, product, flyToCart]);

  const handleIncrement = useCallback(() => {
    if (cartItem && cartItem.quantity < product.stock) {
      updateQuantity(product.id, cartItem.quantity + 1);
    }
  }, [cartItem, updateQuantity, product.id, product.stock]);

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
          maxStock={product.stock}
        />
      ) : (
        <motion.button
          key="add"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          whileTap={tapScale.primary}
          transition={springs.snappy}
          type="button"
          disabled={outOfStock}
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
          className={variant === "horizontal"
            ? "flex items-center gap-1 rounded-full bg-black px-3 py-2 text-caption font-black text-white hover:bg-neutral-800 active:bg-neutral-700 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            : "flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black text-white hover:bg-neutral-800 active:bg-neutral-700 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
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
  vertical = false,
  maxStock
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  vertical?: boolean;
  maxStock: number;
}) {
  if (vertical) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={springs.snappy}
        className="flex flex-col items-center h-[72px] w-[32px] rounded-full bg-black overflow-hidden shadow-sm"
      >
        <motion.button
          type="button"
          onClick={onIncrement}
          disabled={quantity >= maxStock}
          whileTap={quantity < maxStock ? { scale: 1.3 } : undefined}
          transition={springs.tap}
          aria-label="Increase quantity"
          className="flex-1 w-full flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
        </motion.button>
        <motion.span
          key={quantity}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.tap}
          className="text-caption font-bold text-white"
          aria-label={`Quantity: ${quantity}`}
        >
          {quantity}
        </motion.span>
        <motion.button
          type="button"
          onClick={onDecrement}
          whileTap={{ scale: 1.3 }}
          transition={springs.tap}
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
      transition={springs.snappy}
      className="flex h-[36px] items-center overflow-hidden rounded-full bg-black shadow-sm"
    >
      <motion.button
        type="button"
        onClick={onDecrement}
        whileTap={{ scale: 1.4 }}
        transition={springs.tap}
        aria-label="Decrease quantity"
        className="w-9 h-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
      >
        <Minus className="h-3.5 w-3.5" />
      </motion.button>
      <motion.span
        key={quantity}
        initial={{ scale: 1.5, opacity: 0, y: -5 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={springs.tap}
        className="w-6 text-center text-caption font-bold text-white"
        aria-label={`Quantity: ${quantity}`}
      >
        {quantity}
      </motion.span>
      <motion.button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= maxStock}
        whileTap={quantity < maxStock ? { scale: 1.4 } : undefined}
        transition={springs.tap}
        aria-label="Increase quantity"
        className="w-9 h-full flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus className="h-3.5 w-3.5" />
      </motion.button>
    </motion.div>
  );
});
