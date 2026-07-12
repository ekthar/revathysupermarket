"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { GlobalSearchSheet } from "@/components/search/global-search";
import { haptic } from "@/lib/haptics";
import type { Product } from "@/lib/types";

/**
 * Sticky home search entry — opens the global API-backed search sheet.
 * `products` kept for API compatibility with the home page (used as optional seed).
 */
export function HomeSearch({ products: _products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("home");

  return (
    <div className="sticky top-[56px] md:top-[70px] z-30 bg-card/98 backdrop-blur-md px-4 py-3">
      <div className="relative max-w-2xl mx-auto flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            haptic("light");
          }}
          className="relative flex-1 flex items-center h-11 rounded-full bg-muted border border-border pl-10 pr-4 text-left press"
          aria-label={t("searchPlaceholder")}
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-neutral-400 pointer-events-none" />
          <span className="text-body text-muted-foreground truncate">{t("searchPlaceholder")}</span>
        </button>

        <Link
          href="/products"
          aria-label="Open product filters"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shrink-0 press"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Link>
      </div>

      <GlobalSearchSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
