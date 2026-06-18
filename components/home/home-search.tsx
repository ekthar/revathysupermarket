"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/types";

export function HomeSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [products, query]);

  return (
    <div className="sticky top-[56px] md:top-[70px] z-30 bg-white/98 backdrop-blur-md px-4 py-3">
      <div className="relative max-w-2xl mx-auto flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="Search for fast food..."
            className="w-full h-11 rounded-full bg-slate-50 border border-slate-100 pl-10 pr-8 text-[13px] outline-none placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:shadow-sm transition-all"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 press">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter icon button */}
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shrink-0 press">
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {focused && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-12 top-full mt-2 rounded-2xl bg-white border border-slate-100 shadow-lg overflow-hidden z-50"
            >
              {results.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center justify-between px-4 py-3 text-[13px] hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                  <span className="font-semibold text-slate-700">{p.name}</span>
                  <span className="text-[11px] text-slate-400 font-medium">{p.unit}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
