"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import type { Product } from "@/lib/types";

// Lighter transitions - CSS easing instead of spring physics per item
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const AnimatedCategories = memo(function AnimatedCategories({
  categories,
  categoryImages,
  categoryColors,
  categoryIcons,
  allProducts
}: {
  categories: readonly string[];
  categoryImages: Record<string, string>;
  categoryColors: Record<string, string>;
  categoryIcons: Record<string, string>;
  allProducts: Product[];
}) {
  // Memoize product counts per category - avoid O(n*m) on every render
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const product of allProducts) {
      counts[product.category] = (counts[product.category] || 0) + 1;
    }
    return counts;
  }, [allProducts]);

  return (
    <>
      {/* Popular Categories - Desktop with staggered entrance */}
      <section className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 pt-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex items-center justify-between mb-6"
        >
          <h2 className="section-title">Popular Categories</h2>
          <Link href="/products" className="show-all-pill text-sm">
            Show All
            <ChevronUp className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {categories.slice(0, 6).map((cat) => (
            <motion.div key={cat} variants={itemVariants}>
              <Link
                href={`/products?category=${encodeURIComponent(cat)}`}
                className={`category-card category-card-animated ${categoryColors[cat] || "bg-neutral-50"} p-4 flex flex-col items-center justify-center gap-3 press`}
              >
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden">
                  <Image
                    src={categoryImages[cat] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop"}
                    alt={cat}
                    fill
                    sizes="64px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="text-center">
                  <p className="text-body font-bold text-neutral-800 dark:text-white">{cat}</p>
                  <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {categoryCounts[cat] || 0} Products
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Categories grid - Mobile with staggered entrance */}
      <section className="px-4 pt-5 md:hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex items-center justify-between"
        >
          <h2 className="text-title font-bold text-neutral-900 dark:text-white">What are you looking for?</h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-4 gap-2 mt-3 sm:grid-cols-5"
        >
          {categories.map((cat) => (
            <motion.div key={cat} variants={itemVariants}>
              <Link
                href={`/products?category=${encodeURIComponent(cat)}`}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 py-3 px-1 press hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <span className="text-2xl leading-none">
                  {categoryIcons[cat] ?? "\ud83d\uded2"}
                </span>
                <span className="text-micro font-medium text-neutral-600 dark:text-neutral-300 text-center leading-tight line-clamp-1">{cat}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </>
  );
});
