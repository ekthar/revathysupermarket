"use client";

import { cn } from "@/lib/utils";

// Shimmer skeleton block
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        className
      )}
    />
  );
}

// Product card skeleton
export function ProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden card-elevated">
      <Skeleton className={cn("w-full", compact ? "aspect-square" : "aspect-[4/3.2]")} />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-3/4 rounded-full" />
        <Skeleton className="h-2.5 w-1/2 rounded-full" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-7 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Category card skeleton
export function CategoryCardSkeleton() {
  return (
    <div className="category-card bg-neutral-50 dark:bg-neutral-800 p-4 flex flex-col items-center justify-center gap-3">
      <Skeleton className="w-16 h-16 rounded-2xl" />
      <div className="text-center space-y-1.5 w-full">
        <Skeleton className="h-3 w-3/4 mx-auto rounded-full" />
        <Skeleton className="h-2.5 w-1/2 mx-auto rounded-full" />
      </div>
    </div>
  );
}

// Cart item skeleton
export function CartItemSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-3.5 card-elevated">
      <div className="flex gap-3">
        <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4 rounded-full" />
          <Skeleton className="h-2.5 w-1/2 rounded-full" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Hero banner skeleton
export function HeroBannerSkeleton() {
  return (
    <div className="px-4 pt-3 pb-1">
      <Skeleton className="w-full aspect-[2.2/1] rounded-2xl" />
    </div>
  );
}

// Section with multiple product skeletons
export function ProductGridSkeleton({ count = 6, compact = false }: { count?: number; compact?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} compact={compact} />
      ))}
    </div>
  );
}

// Horizontal scroll skeleton
export function HorizontalScrollSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[155px] shrink-0 sm:w-[170px]">
          <ProductCardSkeleton compact />
        </div>
      ))}
    </div>
  );
}
