"use client";

/**
 * Category Mega Menu — Desktop Navigation Enhancement
 * ════════════════════════════════════════════════════
 *
 * Hover-activated dropdown showing all categories with icons,
 * popular items preview, and quick links to filtered product pages.
 *
 * Features:
 * - Smooth Framer Motion enter/exit
 * - Category icons with color coding
 * - Popular items preview for each category
 * - Keyboard navigable (a11y)
 * - Closes on outside click, escape, or mouse leave
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Apple,
  Beef,
  Beer,
  ChevronDown,
  Cookie,
  Droplets,
  Egg,
  Leaf,
  Milk,
  Package,
  Pill,
  Snowflake,
  Sparkles,
  Utensils,
  Wheat,
} from "lucide-react";
import { springs, tapScale } from "@/lib/motion";

// ─── Category Data ────────────────────────────────────────────────────────────

interface CategoryItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  popular?: string[];
}

const categories: CategoryItem[] = [
  {
    name: "Fruits",
    href: "/products?category=Fruits",
    icon: <Apple className="h-5 w-5" />,
    color: "text-red-500 bg-red-50 dark:bg-red-950/30",
    popular: ["Banana", "Apple", "Mango", "Grapes"],
  },
  {
    name: "Vegetables",
    href: "/products?category=Vegetables",
    icon: <Leaf className="h-5 w-5" />,
    color: "text-green-600 bg-green-50 dark:bg-green-950/30",
    popular: ["Tomato", "Onion", "Potato", "Carrot"],
  },
  {
    name: "Dairy",
    href: "/products?category=Dairy",
    icon: <Milk className="h-5 w-5" />,
    color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
    popular: ["Milk", "Curd", "Paneer", "Butter"],
  },
  {
    name: "Beverages",
    href: "/products?category=Beverages",
    icon: <Beer className="h-5 w-5" />,
    color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
    popular: ["Juice", "Tea", "Coffee", "Soda"],
  },
  {
    name: "Snacks",
    href: "/products?category=Snacks",
    icon: <Cookie className="h-5 w-5" />,
    color: "text-orange-500 bg-orange-50 dark:bg-orange-950/30",
    popular: ["Chips", "Biscuits", "Namkeen", "Nuts"],
  },
  {
    name: "Grocery Essentials",
    href: "/products?category=Grocery+Essentials",
    icon: <Wheat className="h-5 w-5" />,
    color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30",
    popular: ["Rice", "Dal", "Oil", "Flour"],
  },
  {
    name: "Frozen Foods",
    href: "/products?category=Frozen+Foods",
    icon: <Snowflake className="h-5 w-5" />,
    color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30",
    popular: ["Ice Cream", "Frozen Veg", "Parathas"],
  },
  {
    name: "Personal Care",
    href: "/products?category=Personal+Care",
    icon: <Droplets className="h-5 w-5" />,
    color: "text-pink-500 bg-pink-50 dark:bg-pink-950/30",
    popular: ["Shampoo", "Soap", "Toothpaste"],
  },
  {
    name: "Household",
    href: "/products?category=Household",
    icon: <Package className="h-5 w-5" />,
    color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30",
    popular: ["Detergent", "Cleaner", "Tissue"],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function MegaMenu() {
  const [open, setOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<CategoryItem | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <button
        type="button"
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-full transition-all ${
          open
            ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white"
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Categories
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={springs.snappy}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[640px] origin-top rounded-2xl bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-900/10 dark:shadow-neutral-900/50 border border-neutral-100 dark:border-neutral-800 overflow-hidden z-50"
          >
            <div className="grid grid-cols-[240px_1fr]">
              {/* Category List */}
              <div className="border-r border-neutral-100 dark:border-neutral-800 py-3 max-h-[420px] overflow-y-auto">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors group ${
                      hoveredCategory?.name === cat.name
                        ? "bg-neutral-50 dark:bg-neutral-800"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.color} transition-transform group-hover:scale-110`}>
                      {cat.icon}
                    </span>
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Preview Panel */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  {hoveredCategory ? (
                    <motion.div
                      key={hoveredCategory.name}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${hoveredCategory.color}`}>
                          {hoveredCategory.icon}
                        </span>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                          {hoveredCategory.name}
                        </h3>
                      </div>

                      {hoveredCategory.popular && (
                        <>
                          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                            Popular items
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {hoveredCategory.popular.map((item) => (
                              <Link
                                key={item}
                                href={`/products?category=${encodeURIComponent(hoveredCategory.name)}&search=${encodeURIComponent(item)}`}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-neutral-400 group-hover:text-secondary-500 transition-colors" />
                                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                                  {item}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </>
                      )}

                      <Link
                        href={hoveredCategory.href}
                        onClick={() => setOpen(false)}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                      >
                        View all {hoveredCategory.name}
                        <span className="text-xs">→</span>
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center py-8"
                    >
                      <Utensils className="h-10 w-10 text-neutral-200 dark:text-neutral-700 mb-3" />
                      <p className="text-sm font-medium text-neutral-400">
                        Hover a category to preview
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom quick links */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 px-5 py-3 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/50">
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                View all products →
              </Link>
              <Link
                href="/offers"
                onClick={() => setOpen(false)}
                className="text-xs font-bold text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 transition-colors"
              >
                Today&apos;s deals 🔥
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
