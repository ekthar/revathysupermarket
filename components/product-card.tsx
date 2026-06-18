"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/product-image";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  horizontal?: boolean;
}

export function ProductCard({ product, compact = false, horizontal = false }: ProductCardProps) {
  const { addItem, items, updateQuantity } = useCart();
  const { showToast } = useToast();
  const price = product.discountPrice ?? product.price;
  const cartItem = items.find((i) => i.id === product.id);
  const outOfStock = product.stock <= 0;

  function add() {
    if (outOfStock) return;
    addItem(product);
    showToast(`Added ${product.name}`, "success");
  }

  // Horizontal list layout
  if (horizontal) {
    return (
      <motion.article
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "product-list-card hover-lift",
          outOfStock && "opacity-50"
        )}
      >
        <Link href={`/products/${product.slug}`} className="shrink-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="h-16 w-16 rounded-xl overflow-hidden bg-slate-50"
          >
            <ProductImage src={product.image} alt={product.name} className="object-cover" />
          </motion.div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-1">
              {product.name}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Local Farmers</p>
          </Link>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[15px] font-black text-slate-900">{formatCurrency(price)}</span>
            <span className="text-[10px] text-slate-400 font-medium">/ {product.unit || "per kg"}</span>
          </div>
        </div>

        <div className="shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {cartItem ? (
              <QuantityStepper
                key="qty"
                quantity={cartItem.quantity}
                onIncrement={() => updateQuantity(product.id, cartItem.quantity + 1)}
                onDecrement={() => updateQuantity(product.id, cartItem.quantity - 1)}
                vertical
              />
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                type="button"
                disabled={outOfStock}
                onClick={add}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3" />
                Add to Cart
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.article>
    );
  }

  // Grid / Compact card layout
  return (
    <motion.article
      whileTap={{ scale: 0.96, rotateX: 1 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative bg-white rounded-2xl overflow-hidden card-elevated product-card-animated",
        outOfStock && "opacity-50"
      )}
    >
      <Link href={`/products/${product.slug}`}>
        <div className={cn(
          "relative bg-slate-50 overflow-hidden",
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
            <motion.span
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
              className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-[2px] rounded-md shadow-sm"
            >
              -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
            </motion.span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-slate-900/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">Sold out</span>
            </div>
          )}
        </div>
      </Link>

      <div className={cn("p-3", compact && "p-2.5")}>
        <Link href={`/products/${product.slug}`}>
          <h3 className={cn(
            "font-semibold text-slate-800 leading-snug line-clamp-2",
            compact ? "text-[11px]" : "text-[12px]"
          )}>{product.name}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Local Farmers</p>
        </Link>

        <div className="flex items-end justify-between mt-2.5 gap-1">
          <div>
            <span className={cn("font-black text-slate-900", compact ? "text-[14px]" : "text-[15px]")}>{formatCurrency(price)}</span>
            <span className="text-[10px] text-slate-400 ml-0.5 font-medium">/ {product.unit || "per kg"}</span>
            {product.discountPrice && (
              <span className="ml-1.5 text-[10px] text-slate-400 line-through">{formatCurrency(product.price)}</span>
            )}
          </div>

          {/* Cart control */}
          <AnimatePresence mode="wait" initial={false}>
            {cartItem ? (
              <QuantityStepper
                key="qty"
                quantity={cartItem.quantity}
                onIncrement={() => updateQuantity(product.id, cartItem.quantity + 1)}
                onDecrement={() => updateQuantity(product.id, cartItem.quantity - 1)}
              />
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                type="button"
                disabled={outOfStock}
                onClick={add}
                className="flex items-center gap-1 h-[30px] px-3 rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline">Add</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}

// Animated quantity stepper with number bounce
function QuantityStepper({
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
        className="flex flex-col items-center h-[72px] w-[32px] rounded-full bg-primary overflow-hidden shadow-sm"
      >
        <motion.button
          type="button"
          onClick={onIncrement}
          whileTap={{ scale: 1.3 }}
          className="flex-1 w-full flex items-center justify-center text-white"
        >
          <Plus className="h-3 w-3" />
        </motion.button>
        <motion.span
          key={quantity}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="text-[11px] font-bold text-white"
        >
          {quantity}
        </motion.span>
        <motion.button
          type="button"
          onClick={onDecrement}
          whileTap={{ scale: 1.3 }}
          className="flex-1 w-full flex items-center justify-center text-white"
        >
          <Minus className="h-3 w-3" />
        </motion.button>
        <motion.button
          type="button"
          onClick={onDecrement}
          className="absolute -bottom-0.5 w-full flex items-center justify-center"
        >
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
      className="flex items-center h-[30px] rounded-full bg-primary overflow-hidden shadow-sm"
    >
      <motion.button
        type="button"
        onClick={onDecrement}
        whileTap={{ scale: 1.4 }}
        className="w-7 h-full flex items-center justify-center text-white"
      >
        <Minus className="h-3 w-3" />
      </motion.button>
      <motion.span
        key={quantity}
        initial={{ scale: 1.5, opacity: 0, y: -5 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="w-5 text-center text-[11px] font-bold text-white"
      >
        {quantity}
      </motion.span>
      <motion.button
        type="button"
        onClick={onIncrement}
        whileTap={{ scale: 1.4 }}
        className="w-7 h-full flex items-center justify-center text-white"
      >
        <Plus className="h-3 w-3" />
      </motion.button>
    </motion.div>
  );
}
