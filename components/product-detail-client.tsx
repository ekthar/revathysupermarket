"use client";

import Link from "next/link";
import { ArrowLeft, Heart, Minus, Plus, Share2, ShoppingBag, Star, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/toast-provider";
import { ProductImage } from "@/components/product-image";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductDetailClient({ product }: { product: Product }) {
  const { addItem, items, updateQuantity } = useCart();
  const { showToast } = useToast();
  const [liked, setLiked] = useState(false);
  const cartItem = items.find((i) => i.id === product.id);
  const price = product.discountPrice ?? product.price;
  const outOfStock = product.stock <= 0;

  function handleAdd() {
    if (outOfStock) return;
    addItem(product);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
    showToast(`Added ${product.name}`, "success");
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: product.name, text: product.description, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied!", "success");
    }
  }

  return (
    <>
      {/* Mobile: Full-width image + overlay nav */}
      <div className="md:hidden relative">
        {/* Back + actions overlay */}
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-4">
          <Link href="/products" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm press">
            <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-white" />
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm press">
              <Share2 className="h-4 w-4 text-slate-700 dark:text-white" />
            </button>
            <motion.button
              onClick={() => setLiked(!liked)}
              whileTap={{ scale: 0.8 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm press"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : "text-slate-700 dark:text-white"}`} />
            </motion.button>
          </div>
        </div>

        {/* Product image - large */}
        <div className="aspect-square bg-slate-50 dark:bg-slate-900 overflow-hidden">
          <motion.div
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full w-full"
          >
            <ProductImage src={product.image} alt={product.name} className="object-cover" />
          </motion.div>
        </div>

        {/* Discount badge */}
        {product.discountPrice && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute bottom-4 left-4 bg-orange-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg"
          >
            -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
          </motion.span>
        )}
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-24 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900 aspect-square"
          >
            <ProductImage src={product.image} alt={product.name} className="object-cover" />
            {product.discountPrice && (
              <span className="absolute top-4 left-4 bg-orange-500 text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
              </span>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-[12px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{product.category}</span>
            <h1 className="mt-4 font-display text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">{product.name}</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">{product.description}</p>

            {/* Rating + unit */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">4.8</span>
                <span className="text-[12px] text-slate-400">(120+ ratings)</span>
              </div>
              <span className="text-[12px] text-slate-500">Unit: {product.unit}</span>
            </div>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(price)}</span>
              {product.discountPrice && (
                <span className="text-lg text-slate-400 line-through">{formatCurrency(product.price)}</span>
              )}
            </div>

            {/* Stock */}
            <p className={`mt-2 text-[13px] font-semibold ${outOfStock ? "text-red-500" : "text-primary"}`}>
              {outOfStock ? "Out of stock" : `${product.stock} in stock`}
            </p>

            {/* Delivery info */}
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
              <Truck className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Free delivery on orders above ₹500</p>
                <p className="text-[11px] text-slate-500">Delivered within 15-30 minutes</p>
              </div>
            </div>

            {/* Add to cart - desktop */}
            <div className="mt-8">
              <AnimatePresence mode="wait">
                {cartItem ? (
                  <motion.div
                    key="qty"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center h-12 rounded-full bg-primary overflow-hidden">
                      <button onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} className="w-12 h-full flex items-center justify-center text-white">
                        <Minus className="h-4 w-4" />
                      </button>
                      <motion.span
                        key={cartItem.quantity}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className="w-8 text-center text-[15px] font-bold text-white"
                      >
                        {cartItem.quantity}
                      </motion.span>
                      <button onClick={() => updateQuantity(product.id, cartItem.quantity + 1)} className="w-12 h-full flex items-center justify-center text-white">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-[14px] font-semibold text-slate-600 dark:text-slate-400">
                      {formatCurrency(price * cartItem.quantity)} total
                    </span>
                  </motion.div>
                ) : (
                  <motion.button
                    key="add"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdd}
                    disabled={outOfStock}
                    className="flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[14px] disabled:opacity-40 press shadow-lg"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile: Product info below image */}
      <div className="md:hidden px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{product.category}</span>
          <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{product.name}</h1>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">4.8</span>
            </div>
            <span className="text-[11px] text-slate-500">{product.unit}</span>
          </div>

          <p className="mt-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{product.description}</p>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(price)}</span>
            {product.discountPrice && (
              <span className="text-sm text-slate-400 line-through">{formatCurrency(product.price)}</span>
            )}
          </div>

          {/* Delivery */}
          <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
            <Truck className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[12px] text-slate-600 dark:text-slate-400">Free delivery above ₹500 • 15-30 min</p>
          </div>
        </motion.div>
      </div>

      {/* Mobile: Fixed bottom add-to-cart bar */}
      <div className="md:hidden fixed bottom-[56px] inset-x-0 z-40 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 p-3" style={{ paddingBottom: "var(--safe-bottom, 0px)" }}>
        <AnimatePresence mode="wait">
          {cartItem ? (
            <motion.div
              key="qty-mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center h-11 rounded-full bg-primary overflow-hidden">
                <button onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} className="w-10 h-full flex items-center justify-center text-white">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <motion.span key={cartItem.quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="w-7 text-center text-[14px] font-bold text-white">
                  {cartItem.quantity}
                </motion.span>
                <button onClick={() => updateQuantity(product.id, cartItem.quantity + 1)} className="w-10 h-full flex items-center justify-center text-white">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <Link href="/cart" className="h-11 px-6 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold press">
                View Cart • {formatCurrency(price * cartItem.quantity)}
              </Link>
            </motion.div>
          ) : (
            <motion.button
              key="add-mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              disabled={outOfStock}
              className="flex items-center justify-center gap-2 h-12 w-full rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[14px] disabled:opacity-40 press shadow-lg"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart • {formatCurrency(price)}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
