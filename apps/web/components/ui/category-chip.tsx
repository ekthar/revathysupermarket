"use client";

import { cn } from "@/lib/utils";

interface CategoryChipProps {
  label: string;
  emoji?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Category filter chip with active state.
 * 44px minimum touch target for accessibility.
 */
export function CategoryChip({ label, emoji, active = false, onClick, className }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Category: ${label}`}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 min-h-touch px-4 py-2 rounded-full text-caption font-bold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:scale-95",
        active
          ? "bg-primary text-primary-foreground shadow-elevation-2"
          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700",
        className
      )}
    >
      {emoji && <span className="text-sm" aria-hidden="true">{emoji}</span>}
      <span>{label}</span>
    </button>
  );
}
