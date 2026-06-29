"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  discountPrice?: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Standardized price display component.
 * Shows current price, optional strike-through original price, and discount badge.
 * Accessible: uses aria-label for screen readers.
 */
export function PriceTag({ price, discountPrice, unit, size = "md", className }: PriceTagProps) {
  const displayPrice = discountPrice ?? price;
  const hasDiscount = discountPrice != null && discountPrice < price;
  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice!) / price) * 100)
    : 0;

  const sizeClasses = {
    sm: { price: "text-body font-bold", original: "text-micro", badge: "text-micro px-1.5 py-0.5" },
    md: { price: "text-title font-black", original: "text-caption", badge: "text-caption px-2 py-0.5" },
    lg: { price: "text-heading font-black", original: "text-body", badge: "text-body px-2.5 py-1" },
  };

  const s = sizeClasses[size];

  return (
    <div
      className={cn("flex items-baseline gap-1.5 flex-wrap", className)}
      aria-label={
        hasDiscount
          ? `Price ${formatCurrency(displayPrice)}, was ${formatCurrency(price)}, ${discountPercent}% off`
          : `Price ${formatCurrency(displayPrice)}`
      }
    >
      <span className={cn(s.price, "text-foreground")}>{formatCurrency(displayPrice)}</span>
      {unit && (
        <span className="text-micro text-muted-foreground font-medium">/ {unit}</span>
      )}
      {hasDiscount && (
        <>
          <span className={cn(s.original, "text-muted-foreground line-through")}>{formatCurrency(price)}</span>
          <span className={cn(s.badge, "rounded-full bg-state-danger/10 text-state-danger font-bold")}>
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
