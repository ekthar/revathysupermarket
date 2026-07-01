"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SubCategory } from "@/lib/types";

interface SubcategoryPillsClientProps {
  subcategories: SubCategory[];
}

export function SubcategoryPillsClient({ subcategories }: SubcategoryPillsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string | null>(searchParams.get("subcategory"));

  const handleSelect = useCallback((subcategorySlug: string | null) => {
    setSelected(subcategorySlug);
    const params = new URLSearchParams(searchParams.toString());
    if (subcategorySlug) {
      params.set("subcategory", subcategorySlug);
    } else {
      params.delete("subcategory");
    }
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
        {/* All pill */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelect(null)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
            !selected
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          )}
        >
          All
        </motion.button>

        {subcategories.map((sub) => (
          <motion.button
            key={sub.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(sub.slug)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
              selected === sub.slug
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            )}
          >
            {sub.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
