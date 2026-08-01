"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { GlobalSearchSheet } from "@/components/search/global-search";
import { haptic } from "@/lib/haptics";

const ROTATE_INTERVAL_MS = 2600;

/**
 * HomeSearch — top-of-fold search entry for the homepage.
 *
 * Search used to be reachable only through an icon in the header. Quick-commerce
 * apps put it above the fold with a placeholder that cycles real popular terms,
 * which doubles as lightweight merchandising ("we actually stock this").
 *
 * Rendered as a button rather than an <input>: tapping opens the existing
 * API-backed search sheet, so there is exactly one search implementation. The
 * button carries a stable aria-label because the visible placeholder animates.
 */
export function HomeSearch({ suggestions = [] }: { suggestions?: string[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // De-duplicate and cap; the row is decorative so a long tail adds nothing.
  const terms = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const term of suggestions) {
      const key = term.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(term.trim());
      if (out.length >= 6) break;
    }
    return out;
  }, [suggestions]);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rotate the placeholder. Skipped entirely when there is nothing to rotate
  // through or the user has asked for reduced motion.
  useEffect(() => {
    if (terms.length < 2 || prefersReduced) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % terms.length),
      ROTATE_INTERVAL_MS
    );
    return () => clearInterval(timer);
  }, [terms.length, prefersReduced]);

  // Allow other surfaces (e.g. the hero CTA) to open search.
  useEffect(() => {
    function handleOpenSearch() {
      setOpen(true);
      haptic("light");
    }
    document.addEventListener("open-global-search", handleOpenSearch);
    return () => document.removeEventListener("open-global-search", handleOpenSearch);
  }, []);

  const activeTerm = terms[index];

  return (
    <div className="sticky top-[var(--mobile-header-height,56px)] md:top-[70px] z-[var(--z-sticky,40)] bg-background/95 backdrop-blur-md px-4 py-3">
      <div className="relative mx-auto flex max-w-2xl items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            haptic("light");
          }}
          className="press relative flex h-12 flex-1 items-center overflow-hidden rounded-full border border-border bg-card pl-10 pr-4 text-left shadow-elevation-1"
          aria-label="Search for groceries"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

          {activeTerm ? (
            <span className="flex min-w-0 items-baseline gap-1 text-body text-muted-foreground">
              <span className="shrink-0">Search</span>
              {/* aria-hidden: the animating term would otherwise be announced on
                  every rotation. The button's aria-label covers the intent. */}
              <span aria-hidden="true" className="relative min-w-0 flex-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={activeTerm}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
                    transition={{ duration: prefersReduced ? 0 : 0.22 }}
                    className="block truncate font-semibold text-neutral-600 dark:text-neutral-300"
                  >
                    &ldquo;{activeTerm}&rdquo;
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          ) : (
            <span className="truncate text-body text-muted-foreground">
              Search for groceries
            </span>
          )}
        </button>

        <Link
          href="/products"
          aria-label="Browse all products and filters"
          className="press flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Link>
      </div>

      <GlobalSearchSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
