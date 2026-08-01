"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { springs } from "@/lib/motion";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

interface AnimatedProductSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  products: Product[];
  showCategoryPills?: boolean;
  categoryPills?: string[];
  categories?: readonly string[];
  layout?: "scroll" | "grid" | "mixed";
  desktopOnly?: boolean;
  hideHeader?: boolean;
}

export function AnimatedProductSection({
  title,
  subtitle,
  icon,
  products,
  showCategoryPills = false,
  categoryPills = [],
  categories = [],
  layout = "scroll",
  desktopOnly = false,
  hideHeader = false
}: AnimatedProductSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Shared whileInView transition settings
  const revealInitial = prefersReduced ? undefined : { opacity: 0.4, y: 12 };
  const revealAnimate = { opacity: 1, y: 0 };
  const viewportOnce = { once: true, amount: 0.15 as const };

  return (
    <motion.section
      ref={sectionRef}
      initial={prefersReduced ? undefined : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={springs.enter}
      className={`pt-8 md:pt-12 overflow-hidden ${desktopOnly ? "hidden md:block" : ""}`}
    >
      {!hideHeader && (
        <motion.div
          initial={revealInitial}
          whileInView={revealAnimate}
          viewport={viewportOnce}
          transition={springs.enter}
          className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="section-title text-lg md:text-2xl">{title}</h2>
            </div>
            <Link href="/products" className="show-all-pill text-xs md:text-sm">
              Show All
              <ChevronRight className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Link>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">{subtitle}</p>
          )}
        </motion.div>
      )}

      {/* Category filter pills */}
      {showCategoryPills && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categoryPills.map((label, idx) => (
              <div key={label} className="shrink-0">
                <Link
                  href={`/products?category=${encodeURIComponent(categories[idx] || label)}`}
                  className={`block whitespace-nowrap px-4 py-2 rounded-full text-caption font-semibold transition-all ${
                    idx === 0
                      ? "bg-primary text-white shadow-sm"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  {label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scroll layout (mobile horizontal) */}
      {(layout === "scroll" || layout === "mixed") && (
        <div className={`mt-4 pb-2 ${layout === "mixed" ? "md:hidden" : ""}`}>
          <motion.div
            initial={revealInitial}
            whileInView={revealAnimate}
            viewport={viewportOnce}
            transition={springs.enter}
            className="wheel-scroll px-4 md:px-6 lg:px-8"
          >
            {products.map((p, idx) => (
              <motion.div
                key={p.id}
                className="product-scroll-item wheel-scroll-item w-[clamp(140px,42vw,155px)] sm:w-[170px] md:w-[200px]"
                initial={prefersReduced ? undefined : { opacity: 0.4, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springs.enter, delay: idx * 0.03 }}
              >
                <ProductCard product={p} compact />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Grid layout (desktop) */}
      {(layout === "grid" || layout === "mixed") && (
        <div className={`max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-4 ${layout === "mixed" ? "hidden md:block" : ""}`}>
          <motion.div
            initial={revealInitial}
            whileInView={revealAnimate}
            viewport={viewportOnce}
            transition={springs.enter}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
          >
            {products.map((p, idx) => (
              <motion.div
                key={p.id}
                className="product-grid-item"
                initial={prefersReduced ? undefined : { opacity: 0.4, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springs.enter, delay: idx * 0.04 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </motion.section>
  );
}
