"use client";

import { motion } from "framer-motion";
import { springs, tapScale } from "@/lib/motion";

export type ProductVariantItem = {
  id: string;
  label: string;
  price: number;
  discountPrice?: number;
  stock: number;
  unit: string;
};

type VariantSelectorProps = {
  variants: ProductVariantItem[];
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
};

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  if (variants.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select variant">
      {variants.map((variant) => {
        const isSelected = variant.id === selectedVariantId;
        const outOfStock = variant.stock <= 0;

        return (
          <motion.button
            key={variant.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={outOfStock}
            whileTap={outOfStock ? tapScale.none : tapScale.subtle}
            transition={springs.tap}
            onClick={() => {
              if (!outOfStock) onSelect(variant.id);
            }}
            disabled={outOfStock}
            className={`relative px-4 py-2 rounded-full text-caption font-semibold border transition-colors
              ${isSelected
                ? "border-primary bg-primary/10 text-primary"
                : outOfStock
                  ? "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary/50"
              }
            `}
          >
            {isSelected && (
              <motion.span
                layoutId="variant-indicator"
                className="absolute inset-0 rounded-full border-2 border-primary"
                transition={springs.indicator}
              />
            )}
            <span className="relative z-10">{variant.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
