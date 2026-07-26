"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Apple,
  LeafyGreen,
  Milk,
  Coffee,
  Cookie,
  Sofa,
  Sparkles,
  Snowflake,
  ShoppingBag,
  type LucideIcon
} from "lucide-react";
import { memo, useMemo, type ComponentType } from "react";
import { ScrollReveal, ScrollRevealItem } from "@/components/ui/gsap/scroll-reveal";
import type { Product } from "@/lib/types";

const categoryIcons: Record<string, ComponentType<{ className?: string }>> = {
  Fruits: Apple,
  Vegetables: LeafyGreen,
  Dairy: Milk,
  Beverages: Coffee,
  Snacks: Cookie,
  Household: Sofa,
  "Personal Care": Sparkles,
  "Frozen Foods": Snowflake,
  "Grocery Essentials": ShoppingBag
};

function fallbackIcon(cat: string) {
  const Icon = categoryIcons[cat];
  return Icon ? <Icon className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />;
}

export const AnimatedCategories = memo(function AnimatedCategories({
  categories,
  categoryImages,
  categoryIcons: iconOverrides,
  allProducts
}: {
  categories: readonly string[];
  categoryImages: Record<string, string>;
  categoryIcons: Record<string, string>;
  allProducts: Product[];
}) {
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const product of allProducts) {
      counts[product.category] = (counts[product.category] || 0) + 1;
    }
    return counts;
  }, [allProducts]);

  return (
    <>
      {/* Desktop categories */}
      <section className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 pt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Popular Categories</h2>
          <Link href="/products" className="show-all-pill text-sm">
            Show All
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ScrollReveal y={16} stagger={0.05} amount={0.3}>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat) => (
              <ScrollRevealItem key={cat}>
                <Link
                  href={`/products?category=${encodeURIComponent(cat)}`}
                  className="flex flex-col items-center gap-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 press hover:border-secondary-200 dark:hover:border-secondary-800 hover:shadow-elevation-1 transition-all"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400">
                    {iconOverrides[cat] ? (
                      <span className="text-2xl leading-none">{iconOverrides[cat]}</span>
                    ) : (
                      fallbackIcon(cat)
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-body font-bold text-neutral-800 dark:text-white">{cat}</p>
                    <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {categoryCounts[cat] || 0} Products
                    </p>
                  </div>
                </Link>
              </ScrollRevealItem>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Mobile categories — horizontal scroll circles (Swiggy-style) */}
      <section className="pt-4 md:hidden">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-title font-bold text-neutral-900 dark:text-white">Shop by Category</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400">
                {iconOverrides[cat] ? (
                  <span className="text-xl leading-none">{iconOverrides[cat]}</span>
                ) : (
                  fallbackIcon(cat)
                )}
              </div>
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 text-center leading-tight line-clamp-2 w-full">{cat}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
});
