"use client";

import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { memo, useRef } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

// Lighter transition - uses CSS transform instead of spring physics on each item
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.08
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

export const AnimatedProductSection = memo(function AnimatedProductSection({
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
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section
      ref={sectionRef}
      className={`pt-8 md:pt-12 overflow-hidden ${desktopOnly ? "hidden md:block" : ""}`}
    >
      {!hideHeader && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <h2 className="section-title text-lg md:text-2xl">{title}</h2>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.25, ease: "easeOut", delay: 0.15 }}
              >
                <Link href="/products" className="show-all-pill text-xs md:text-sm">
                  Show All
                  <ChevronUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </Link>
              </motion.div>
            </div>
            {subtitle && (
              <p className="mt-1 text-xs md:text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
            )}
          </motion.div>

          {/* Category filter pills */}
          {showCategoryPills && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
              className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1"
            >
              {categoryPills.map((label, idx) => (
                <div key={label} className="shrink-0">
                  <Link
                    href={`/products?category=${encodeURIComponent(categories[idx] || label)}`}
                    className={`block whitespace-nowrap px-4 py-2 rounded-full text-caption font-semibold transition-all ${
                      idx === 0
                        ? "bg-primary text-white shadow-sm"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {label}
                  </Link>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Product display - scroll layout uses CSS animations instead of per-item framer-motion */}
      {(layout === "scroll" || layout === "mixed") && (
        <div
          className={`mt-4 pb-2 max-w-7xl mx-auto ${layout === "mixed" ? "md:hidden" : ""}`}
          style={{ opacity: isInView ? 1 : 0, transition: "opacity 0.3s ease" }}
        >
          {/* Wheel-like smooth scroll container - NO per-item motion.div wrappers */}
          <div className="wheel-scroll px-4 md:px-6 lg:px-8">
            {products.map((p, idx) => (
              <div
                key={p.id}
                className="wheel-scroll-item w-[clamp(140px,42vw,155px)] sm:w-[170px] md:w-[200px] animate-fade-in-up"
                style={{
                  animationDelay: isInView ? `${idx * 40}ms` : "0ms",
                  animationFillMode: "both",
                  animationDuration: "0.35s",
                  opacity: isInView ? undefined : 0,
                }}
              >
                <ProductCard product={p} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {(layout === "grid" || layout === "mixed") && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className={`max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-4 ${layout === "mixed" ? "hidden md:block" : ""}`}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {products.map((p) => (
              <motion.div key={p.id} variants={itemVariants}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
});
