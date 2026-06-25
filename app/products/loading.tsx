import { ProductSkeletonGrid } from "@/components/ui/product-skeleton-grid";

export default function ProductsLoading() {
  return (
    <div className="space-y-5 px-4 pt-4 pb-24">
      {/* Header area */}
      <div className="space-y-2">
        <div className="relative h-8 w-32 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
        </div>
        <div className="relative h-4 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
        </div>
      </div>

      {/* Search input */}
      <div className="relative h-12 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
      </div>

      {/* Category chips row */}
      <div className="flex gap-2.5 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="relative h-9 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
          </div>
        ))}
      </div>

      {/* Product grid */}
      <ProductSkeletonGrid count={8} />
    </div>
  );
}
