"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { springs } from "@/lib/motion";

/**
 * StickySearchBar — compact search that appears when main search scrolls away.
 *
 * Pattern: Safari URL bar collapse. When the expanded search/filter area
 * scrolls out of view, a compact sticky bar slides down from the top showing
 * just the essential info (search query, active category, item count).
 *
 * Tapping it either:
 * - Scrolls back to the expanded search area
 * - Opens the filter sheet (via onOpenFilters)
 */
export function StickySearchBar({
  query,
  category,
  total,
  observeRef,
  onTap,
  onOpenFilters,
}: {
  query: string;
  category: string;
  total: number;
  observeRef: React.RefObject<HTMLElement | null>;
  onTap: () => void;
  onOpenFilters: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = observeRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show compact bar when the main search is NOT visible
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-56px 0px 0px 0px" } // offset by header height
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [observeRef]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={springs.snappy}
          className="fixed top-[calc(var(--mobile-header-height,56px)+env(safe-area-inset-top,0px))] inset-x-0 z-30 px-4 pt-2 pb-2 md:hidden"
        >
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-elevation-2 px-3 py-2">
            {/* Search area — tappable */}
            <button
              type="button"
              onClick={onTap}
              className="flex-1 flex items-center gap-2 min-w-0 press"
              aria-label="Scroll to search"
            >
              <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
                {query ? query : category !== "All" ? category : "Search products..."}
              </span>
            </button>

            {/* Filter button */}
            <button
              type="button"
              onClick={onOpenFilters}
              className="flex h-8 items-center gap-1.5 rounded-xl bg-neutral-900 dark:bg-white px-3 press"
              aria-label="Filters"
            >
              <SlidersHorizontal className="h-3 w-3 text-white dark:text-neutral-900" />
              <span className="text-[11px] font-bold text-white dark:text-neutral-900">{total}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
