function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 ${className || ""}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
  );
}

export default function OffersLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Skeleton Hero Card */}
      <SkeletonPulse className="h-40 w-full sm:h-48" />

      {/* Skeleton Filter Tab Pills */}
      <div className="mt-6 flex gap-3">
        <SkeletonPulse className="h-9 w-16 rounded-full" />
        <SkeletonPulse className="h-9 w-28 rounded-full" />
        <SkeletonPulse className="h-9 w-24 rounded-full" />
      </div>

      {/* Skeleton Coupon-Ticket Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex overflow-hidden rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
          >
            {/* Left accent strip */}
            <SkeletonPulse className="w-2 shrink-0 rounded-none" />

            {/* Card body */}
            <div className="flex-1 space-y-3 p-4">
              {/* Discount badge */}
              <SkeletonPulse className="h-6 w-20 rounded-full" />

              {/* Title line */}
              <SkeletonPulse className="h-4 w-3/4 rounded-full" />

              {/* Description line */}
              <SkeletonPulse className="h-3 w-1/2 rounded-full" />

              {/* Bottom row: category + timer */}
              <div className="flex items-center gap-2 pt-1">
                <SkeletonPulse className="h-5 w-16 rounded-full" />
                <SkeletonPulse className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
