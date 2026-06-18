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

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
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

  return (
    <motion.article
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative bg-white rounded-2xl overflow-hidden card-shadow",
        outOfStock && "opacity-50"
      )}
    >
      <Link href={`/products/${product.slug}`}>
        <div className={cn(
          "relative bg-slate-50 overflow-hidden",
          compact ? "aspect-square rounded-t-2xl" : "aspect-[4/3.2] rounded-t-2xl"
        )}>
          <ProductImage src={product.image} alt={product.name} className="object-cover transition-transform duration-300" />
          {product.discountPrice && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-[2px] rounded-md shadow-sm">
              OFFER
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-slate-900/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">Sold out</span>
            </div>
          )}
        </div>
      </Link>

      <div className={cn("p-2.5", compact && "p-2")}>
        <Link href={`/products/${product.slug}`}>
          <h3 className={cn(
            "font-medium text-slate-800 leading-snug line-clamp-2",
            compact ? "text-[11px]" : "text-[12px]"
          )}>{product.name}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">{product.unit}</p>
        </Link>

        <div className="flex items-end justify-between mt-2 gap-1">
          <div>
            <span className={cn("font-bold text-slate-900", compact ? "text-[13px]" : "text-[14px]")}>{formatCurrency(price)}</span>
            {product.discountPrice && (
              <span className="ml-1 text-[10px] text-slate-400 line-through">{formatCurrency(product.price)}</span>
            )}
          </div>

          {/* Cart control */}
          <AnimatePresence mode="wait" initial={false}>
            {cartItem ? (
              <motion.div
                key="qty"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex items-center h-[28px] rounded-lg bg-primary overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                  className="w-7 h-full flex items-center justify-center text-white active:bg-black/10"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-[11px] font-bold text-white">{cartItem.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  className="w-7 h-full flex items-center justify-center text-white active:bg-black/10"
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
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                type="button"
                disabled={outOfStock}
                onClick={add}
                className="h-[28px] px-3.5 rounded-lg border-[1.5px] border-primary text-primary text-[11px] font-bold active:scale-95 active:bg-primary/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ADD
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}
