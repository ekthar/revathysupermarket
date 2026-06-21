"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

export function AnimatedCategories({
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
  return (
    <>
      {/* Popular Categories - Desktop with staggered entrance */}
      <section className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 pt-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                className={`category-card category-card-animated ${categoryColors[cat] || "bg-slate-50"} p-4 flex flex-col items-center justify-center gap-3 press`}
              >
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden">
                  <Image
                    src={categoryImages[cat] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop"}
                    alt={cat}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform duration-500 hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-slate-800 dark:text-white">{cat}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {allProducts.filter((p) => p.category === cat).length} Products
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
          initial={{ opacity: 0, x: -15 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">What are you looking for?</h2>
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
                className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 py-3 px-1 press hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <motion.span
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-2xl leading-none"
                >
                  {categoryIcons[cat] ?? "\ud83d\uded2"}
                </motion.span>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 text-center leading-tight line-clamp-1">{cat}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </>
  );
}
