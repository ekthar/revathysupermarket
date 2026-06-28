"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

/**
 * Streaming skeleton system - renders layout instantly while data loads.
 * 
 * Design principles:
 * - Never show blocking spinners
 * - Render layout structure immediately  
 * - Replace skeleton progressively as data arrives
 * - Prioritize above-the-fold content
 * - Use CSS-only animations (no JS overhead)
 */

// Base shimmer skeleton block - pure CSS animation, no framer-motion
export const SkeletonPulse = memo(function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800",
        className
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
    </div>
  );
});

// Home page hero section skeleton
export const HeroSkeleton = memo(function HeroSkeleton() {
  return (
    <div className="px-4 pt-3 pb-1">
      <SkeletonPulse className="w-full aspect-[2.2/1] rounded-2xl" />
    </div>
  );
});

// Category row skeleton (mobile: 4 cols, desktop: 6 cols)
export const CategoryRowSkeleton = memo(function CategoryRowSkeleton() {
  return (
    <div className="px-4 pt-5">
      <SkeletonPulse className="h-5 w-48 rounded-full mb-3" />
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 py-3">
            <SkeletonPulse className="h-10 w-10 rounded-full" />
            <SkeletonPulse className="h-2.5 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
});

// Horizontal product scroll section skeleton
export const ProductScrollSectionSkeleton = memo(function ProductScrollSectionSkeleton({ 
  showHeader = true 
}: { showHeader?: boolean }) {
  return (
    <div className="pt-8">
      {showHeader && (
        <div className="px-4 md:px-6 flex items-center justify-between mb-4">
          <SkeletonPulse className="h-6 w-44 rounded-lg" />
          <SkeletonPulse className="h-8 w-20 rounded-full" />
        </div>
      )}
      <div className="flex gap-3 overflow-hidden px-4 md:px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-[155px] sm:w-[170px] shrink-0">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
              <SkeletonPulse className="aspect-square rounded-none" />
              <div className="p-2.5 space-y-2">
                <SkeletonPulse className="h-2.5 w-3/4 rounded-full" />
                <SkeletonPulse className="h-2 w-1/2 rounded-full" />
                <div className="flex items-center justify-between">
                  <SkeletonPulse className="h-3.5 w-12 rounded-full" />
                  <SkeletonPulse className="h-6 w-6 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Product grid skeleton (for /products page)
export const ProductGridSkeleton = memo(function ProductGridSkeleton({ 
  count = 8, 
  compact = false 
}: { count?: number; compact?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
          <SkeletonPulse className={cn("rounded-none", compact ? "aspect-square" : "aspect-[4/3.2]")} />
          <div className="p-3 space-y-2.5">
            <SkeletonPulse className="h-3 w-3/4 rounded-full" />
            <SkeletonPulse className="h-2.5 w-1/2 rounded-full" />
            <div className="flex items-center justify-between pt-1">
              <SkeletonPulse className="h-4 w-16 rounded-full" />
              <SkeletonPulse className="h-7 w-7 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

// Full home page streaming skeleton (above-the-fold priority)
export const HomePageSkeleton = memo(function HomePageSkeleton() {
  return (
    <div className="space-y-1 pb-24">
      {/* Search bar - highest priority */}
      <div className="px-4 pt-3">
        <SkeletonPulse className="h-11 rounded-2xl" />
      </div>

      {/* Hero banner - above fold */}
      <HeroSkeleton />

      {/* Categories - above fold on mobile */}
      <CategoryRowSkeleton />

      {/* First product section - visible on scroll */}
      <ProductScrollSectionSkeleton />

      {/* Second product section - below fold */}
      <ProductScrollSectionSkeleton />
    </div>
  );
});

// Cart page skeleton (matches CartPageClient layout)
export const CartPageSkeleton = memo(function CartPageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-36 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <SkeletonPulse className="h-2.5 w-16 rounded-full" />
            <SkeletonPulse className="h-5 w-20 rounded-lg" />
          </div>
        </div>
        <SkeletonPulse className="h-5 w-16 rounded-full" />
      </div>

      {/* Cart items */}
      <div className="mt-4 rounded-lg bg-white shadow-elevation-3 dark:bg-neutral-900 divide-y divide-neutral-50 dark:divide-neutral-800">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3">
            <SkeletonPulse className="h-4 w-4 rounded-sm" />
            <div className="flex-1 space-y-1.5">
              <SkeletonPulse className="h-3.5 w-3/4 rounded-full" />
              <SkeletonPulse className="h-2.5 w-1/3 rounded-full" />
            </div>
            <SkeletonPulse className="h-[30px] w-20 rounded-full" />
            <SkeletonPulse className="h-4 w-14 rounded-full" />
          </div>
        ))}
      </div>

      {/* Coupon section */}
      <div className="mt-3 rounded-lg bg-white p-3.5 shadow-elevation-2 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-4 w-4 rounded" />
          <SkeletonPulse className="h-9 flex-1 rounded-lg" />
          <SkeletonPulse className="h-5 w-12 rounded-full" />
        </div>
      </div>

      {/* Bill details */}
      <div className="mt-3 rounded-lg bg-white p-4 shadow-elevation-2 dark:bg-neutral-900 space-y-3">
        <SkeletonPulse className="h-4 w-20 rounded-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <SkeletonPulse className="h-3 w-24 rounded-full" />
            <SkeletonPulse className="h-3 w-14 rounded-full" />
          </div>
        ))}
      </div>

      {/* Checkout button */}
      <div className="mt-5">
        <SkeletonPulse className="h-[54px] rounded-2xl" />
      </div>
    </div>
  );
});

// Product detail page skeleton
export const ProductDetailSkeleton = memo(function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-4">
      {/* Image */}
      <SkeletonPulse className="aspect-square w-full rounded-2xl md:aspect-[4/3]" />
      
      {/* Title + price */}
      <div className="mt-4 space-y-3">
        <SkeletonPulse className="h-6 w-3/4 rounded-lg" />
        <SkeletonPulse className="h-4 w-1/2 rounded-full" />
        <div className="flex items-center gap-3">
          <SkeletonPulse className="h-8 w-20 rounded-full" />
          <SkeletonPulse className="h-5 w-14 rounded-full" />
        </div>
      </div>

      {/* Add to cart button */}
      <div className="mt-6">
        <SkeletonPulse className="h-12 w-full rounded-2xl" />
      </div>

      {/* Description */}
      <div className="mt-6 space-y-2">
        <SkeletonPulse className="h-4 w-full rounded-full" />
        <SkeletonPulse className="h-4 w-5/6 rounded-full" />
        <SkeletonPulse className="h-4 w-2/3 rounded-full" />
      </div>

      {/* Related products */}
      <div className="mt-8">
        <SkeletonPulse className="h-6 w-36 rounded-lg mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
              <SkeletonPulse className="aspect-square rounded-none" />
              <div className="p-2.5 space-y-2">
                <SkeletonPulse className="h-2.5 w-3/4 rounded-full" />
                <SkeletonPulse className="h-3.5 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
