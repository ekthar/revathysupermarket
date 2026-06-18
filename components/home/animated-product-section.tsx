"use client";

import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
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

interface AnimatedProductSectionProps {
  title: string;
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
      className={`pt-8 md:pt-12 ${desktopOnly ? "hidden md:block" : ""}`}
    >
      {!hideHeader && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="section-title text-lg md:text-2xl">{title}</h2>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            >
              <Link href="/products" className="show-all-pill text-xs md:text-sm">
                Show All
                <ChevronUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Category filter pills */}
          {showCategoryPills && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
              className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1"
            >
              {categoryPills.map((label, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.2 + idx * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    href={`/products?category=${encodeURIComponent(categories[idx] || label)}`}
                    className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold transition-all spring-transition ${
                      idx === 0
                        ? "bg-primary text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105"
                    }`}
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Product display */}
      {(layout === "scroll" || layout === "mixed") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.25 }}
          className={`mt-4 pb-2 max-w-7xl mx-auto ${layout === "mixed" ? "md:hidden" : ""}`}
        >
          {/* Wheel-like smooth scroll container */}
          <div className="wheel-scroll px-4 md:px-6 lg:px-8">
            {products.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + idx * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                className="wheel-scroll-item w-[155px] sm:w-[170px] md:w-[200px]"
              >
                <ProductCard product={p} compact />
              </motion.div>
            ))}
          </div>
        </motion.div>
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
}
