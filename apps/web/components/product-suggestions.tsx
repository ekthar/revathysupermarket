"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { springs, tapScale } from "@/lib/motion";
import { formatCurrency } from "@/lib/utils";
import { useCartActions } from "@/components/cart/cart-provider";
import { useToast } from "@/components/toast-provider";
import { ProductImage } from "@/components/product-image";

type SuggestionProduct = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  discountPrice?: number;
  unit: string;
  stock: number;
};

interface ProductSuggestionsProps {
  productSlug?: string;
  cartProductIds?: string[];
  title?: string;
}

export function ProductSuggestions({
  productSlug,
  cartProductIds,
  title = "Frequently Bought Together",
}: ProductSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartActions();
  const { showToast } = useToast();

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      let url: string;

      if (productSlug) {
        url = `/api/products/${productSlug}/suggestions`;
      } else if (cartProductIds && cartProductIds.length > 0) {
        url = `/api/cart/suggestions?ids=${cartProductIds.join(",")}`;
      } else {
        setLoading(false);
        return;
      }

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, [productSlug, cartProductIds]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 pb-8 pt-4 md:px-6 lg:px-8">
        <div className="h-5 w-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse mb-4" />
        <div className="flex gap-3 overflow-x-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[150px]">
              <div className="aspect-square rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse mb-2" />
              <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-1" />
              <div className="h-3 w-14 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (suggestions.length === 0) return null;

  function handleAdd(product: SuggestionProduct) {
    if (product.stock <= 0) return;
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: "Grocery Essentials" as const,
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.image,
      description: "",
      stock: product.stock,
      popularity: 0,
      unit: product.unit,
    });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    showToast(`Added ${product.name}`, "success");
  }

  return (
    <section className="max-w-7xl mx-auto px-4 pb-8 pt-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-title font-bold text-neutral-900 dark:text-white">
          {title}
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
        {suggestions.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.enter, delay: i * 0.05 }}
            className="flex-shrink-0 w-[150px] snap-start"
          >
            <div className="rounded-xl bg-white overflow-hidden shadow-elevation-2 dark:bg-neutral-900 h-full flex flex-col">
              <Link href={`/products/${product.slug}`}>
                <div className="aspect-square bg-neutral-50 dark:bg-neutral-800 overflow-hidden">
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    className="object-cover"
                  />
                </div>
              </Link>
              <div className="p-2.5 flex flex-col flex-1">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="text-caption font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-micro text-neutral-400 mt-0.5">
                    {product.unit}
                  </p>
                </Link>
                <div className="mt-auto pt-2 flex items-center justify-between gap-1">
                  <div>
                    <span className="text-body font-black text-neutral-900 dark:text-white">
                      {formatCurrency(product.discountPrice ?? product.price)}
                    </span>
                    {product.discountPrice && (
                      <span className="ml-1 text-micro text-neutral-400 line-through">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                  <motion.button
                    whileTap={tapScale.subtle}
                    type="button"
                    onClick={() => handleAdd(product)}
                    disabled={product.stock <= 0}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white hover:bg-neutral-800 active:bg-neutral-700 shadow-sm transition-colors disabled:opacity-30"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
