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
    <article className={cn(
      "relative bg-white border border-slate-100 rounded-lg overflow-hidden",
      outOfStock && "opacity-50"
    )}>
      <Link href={`/products/${product.slug}`}>
        <div className={cn("relative bg-slate-50 overflow-hidden", compact ? "aspect-square" : "aspect-[4/3]")}>
          <ProductImage src={product.image} alt={product.name} className="object-cover" />
          {product.discountPrice && (
            <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              OFFER
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">SOLD OUT</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-2">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-[12px] font-medium text-slate-800 leading-tight line-clamp-2">{product.name}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">{product.unit}</p>
        </Link>

        <div className="flex items-center justify-between mt-2 gap-1">
          <div>
            <span className="text-[13px] font-bold text-slate-900">{formatCurrency(price)}</span>
            {product.discountPrice && (
              <span className="ml-1 text-[10px] text-slate-400 line-through">{formatCurrency(product.price)}</span>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {cartItem ? (
              <motion.div
                key="qty"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center h-7 rounded border border-primary bg-primary/5"
              >
                <button type="button" onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} className="w-6 h-full flex items-center justify-center text-primary">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-[11px] font-bold text-primary">{cartItem.quantity}</span>
                <button type="button" onClick={() => updateQuantity(product.id, cartItem.quantity + 1)} className="w-6 h-full flex items-center justify-center text-primary">
                  <Plus className="h-3 w-3" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                type="button"
                disabled={outOfStock}
                onClick={add}
                className="h-7 px-3 rounded border border-primary text-primary text-[11px] font-bold active:scale-95 transition disabled:opacity-40"
              >
                ADD
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}
