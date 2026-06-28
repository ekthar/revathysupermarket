import { SkeletonPulse, ProductGridSkeleton } from "@/components/ui/streaming-skeleton";

/**
 * Products listing page loading skeleton.
 * Renders search + filters + grid layout instantly.
 * CSS-only shimmer - no JS computation during loading.
 */
export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 sm:py-10 lg:px-8">
      {/* Search input */}
      <SkeletonPulse className="h-12 rounded-2xl" />

      {/* Category chips row (mobile) */}
      <div className="mt-3 flex gap-2.5 overflow-hidden md:hidden">
        <SkeletonPulse className="h-10 w-20 shrink-0 rounded-2xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-9 w-20 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Desktop filters */}
      <div className="mt-3 hidden md:grid md:grid-cols-[1.2fr_1fr_1fr] md:gap-4">
        <SkeletonPulse className="h-12 rounded-2xl" />
        <SkeletonPulse className="h-12 rounded-2xl" />
      </div>

      {/* Product grid */}
      <div className="mt-5">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
