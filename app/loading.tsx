import { ProductSkeletonGrid } from "@/components/ui/product-skeleton-grid";

export default function HomeLoading() {
  return (
    <div className="space-y-5 px-4 pt-4 pb-24">
      {/* Search bar */}
      <div className="relative h-11 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
      </div>

      {/* Hero banner - mobile */}
      <div className="relative aspect-[2.2/1] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 md:hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
      </div>

      {/* Hero banner - desktop */}
      <div className="relative hidden aspect-[2.2/1] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 md:block">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
      </div>

      {/* Categories row */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
            </div>
            <div className="h-2.5 w-12 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Product grid */}
      <ProductSkeletonGrid count={6} />
    </div>
  );
}
