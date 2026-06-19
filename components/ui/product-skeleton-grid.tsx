"use client";

import { motion } from "framer-motion";

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 ${className || ""}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
    </div>
  );
}

export function ProductSkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
      <SkeletonPulse className="aspect-[4/3.2] rounded-none" />
      <div className="p-3 space-y-2.5">
        <SkeletonPulse className="h-3 w-3/4 rounded-full" />
        <SkeletonPulse className="h-2.5 w-1/2 rounded-full" />
        <div className="flex items-center justify-between pt-1">
          <SkeletonPulse className="h-4 w-16 rounded-full" />
          <SkeletonPulse className="h-7 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <ProductSkeletonCard />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Horizontal scroll skeleton
export function ProductScrollSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[155px] shrink-0 sm:w-[170px]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <SkeletonPulse className="aspect-square rounded-none" />
            <div className="p-2.5 space-y-2">
              <SkeletonPulse className="h-2.5 w-3/4 rounded-full" />
              <SkeletonPulse className="h-2 w-1/2 rounded-full" />
              <div className="flex items-center justify-between">
                <SkeletonPulse className="h-3.5 w-12 rounded-full" />
                <SkeletonPulse className="h-6 w-10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Order card skeleton
export function OrderSkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center gap-3">
        <SkeletonPulse className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-3.5 w-1/3 rounded-full" />
          <SkeletonPulse className="h-2.5 w-2/3 rounded-full" />
        </div>
        <SkeletonPulse className="h-4 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function OrderSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <OrderSkeletonCard />
        </motion.div>
      ))}
    </div>
  );
}
