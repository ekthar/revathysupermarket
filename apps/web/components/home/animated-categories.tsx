"use client";

import Link from "next/link";
import Image from "next/image";
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
import { memo, useMemo, type ComponentType, type ReactNode } from "react";
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

      {/* Mobile categories grid */}
      <section className="px-4 pt-5 md:hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-title font-bold text-neutral-900 dark:text-white">What are you looking for?</h2>
        </div>

        <ScrollReveal y={12} stagger={0.04} amount={0.2}>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {categories.map((cat) => (
              <ScrollRevealItem key={cat}>
                <Link
                  href={`/products?category=${encodeURIComponent(cat)}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 py-3 px-1 press hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center text-neutral-600 dark:text-neutral-300">
                    {fallbackIcon(cat)}
                  </span>
                  <span className="text-micro font-medium text-neutral-600 dark:text-neutral-300 text-center leading-tight line-clamp-1">{cat}</span>
                </Link>
              </ScrollRevealItem>
            ))}
          </div>
        </ScrollReveal>
      </section>
    </>
  );
});
