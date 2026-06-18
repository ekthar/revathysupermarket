"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HomeSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [products, query]);

  return (
    <div className="sticky top-14 z-30 border-b border-slate-100 bg-white/98 px-4 py-3 backdrop-blur-sm dark:border-white/5 dark:bg-slate-950/98 sm:top-16">
      <div className="mx-auto max-w-2xl">
        <div className={cn(
          "relative flex h-11 items-center rounded-xl border bg-slate-50 transition-all dark:bg-white/5",
          focused ? "border-primary shadow-sm ring-2 ring-primary/10" : "border-slate-200 dark:border-white/10"
        )}>
          <Search className="ml-3.5 h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search for groceries..."
            className="h-full flex-1 bg-transparent px-3 text-sm font-medium outline-none placeholder:text-slate-400"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="mr-3 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        <AnimatePresence>
          {focused && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-4 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900"
            >
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <span className="font-medium text-slate-700 dark:text-white">{product.name}</span>
                  <span className="text-xs text-slate-400">{product.unit}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
