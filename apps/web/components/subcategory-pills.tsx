"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SubCategory } from "@/lib/types";

interface SubcategoryPillsProps {
  categoryId: string | null;
  selectedSubcategory: string | null;
  onSelect: (subcategoryId: string | null) => void;
}

export function SubcategoryPills({ categoryId, selectedSubcategory, onSelect }: SubcategoryPillsProps) {
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    setLoading(true);
    fetch(`/api/subcategories?categoryId=${categoryId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.subcategories && Array.isArray(data.subcategories)) {
          setSubcategories(data.subcategories);
        } else {
          setSubcategories([]);
        }
      })
      .catch(() => setSubcategories([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  const handleSelect = useCallback((id: string | null) => {
    onSelect(id);
  }, [onSelect]);

  if (!categoryId || (subcategories.length === 0 && !loading)) return null;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 md:px-0 py-2"
      >
        {/* All pill */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelect(null)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
            !selectedSubcategory
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          )}
        >
          All
        </motion.button>

        {loading ? (
          // Skeleton pills
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 h-8 w-20 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            ))}
          </>
        ) : (
          subcategories.map((sub) => (
            <motion.button
              key={sub.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(sub.id)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                selectedSubcategory === sub.id
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              )}
            >
              {sub.name}
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
