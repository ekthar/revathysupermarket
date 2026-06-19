"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/toast-provider";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";

type FavoriteProduct = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  discountPrice?: number;
  unit: string;
  stock: number;
  category: string;
  addedAt: string;
};

export function FavoritesClient({ products: initialProducts }: { products: FavoriteProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const { addItem, items, updateQuantity } = useCart();
  const { showToast } = useToast();

  async function removeFavorite(productId: string) {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      const res = await fetch(`/api/favorites/${productId}`, { method: "DELETE" });
      if (!res.ok) {
        setProducts(initialProducts);
        showToast("Failed to remove", "error");
      } else {
        showToast("Removed from favorites", "success");
      }
    } catch {
      setProducts(initialProducts);
    }
  }

  function addToCart(product: FavoriteProduct) {
    if (product.stock <= 0) return;
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      discountPrice: product.discountPrice,
      unit: product.unit,
      stock: product.stock,
      category: product.category as any,
      description: "",
      popularity: 0
    });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    showToast(`Added ${product.name}`, "success");
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {products.map((product) => {
          const cartItem = items.find((i) => i.id === product.id);
          const price = product.discountPrice ?? product.price;
          const outOfStock = product.stock <= 0;

          return (
            <motion.article
              key={product.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 card-shadow"
            >
              <Link href={`/products/${product.slug}`} className="shrink-0">
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <ProductImage src={product.image} alt={product.name} className="object-cover" />
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="text-[13px] font-semibold text-slate-800 dark:text-white leading-snug line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{product.category}</p>
                </Link>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[14px] font-bold text-slate-900 dark:text-white">{formatCurrency(price)}</span>
                  {product.discountPrice && (
                    <span className="text-[10px] text-slate-400 line-through">{formatCurrency(product.price)}</span>
                  )}
                  <span className="text-[10px] text-slate-400">/ {product.unit}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {/* Remove from favorites */}
                <button
                  type="button"
                  onClick={() => removeFavorite(product.id)}
                  className="h-7 w-7 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center press"
                >
                  <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                </button>

                {/* Add to cart / Quantity */}
                {outOfStock ? (
                  <span className="text-[9px] font-semibold text-slate-400">Out of stock</span>
                ) : cartItem ? (
                  <div className="flex items-center h-[28px] rounded-full bg-primary overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                      className="w-6 h-full flex items-center justify-center text-white press"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-[11px] font-bold text-white">{cartItem.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                      className="w-6 h-full flex items-center justify-center text-white press"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary press"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                )}
              </div>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
