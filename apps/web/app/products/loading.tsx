import { ProductSkeletonGrid } from "@/components/ui/product-skeleton-grid";

export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-background pb-24">
      <section className="overflow-hidden px-4 pb-1 pt-8 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-12 w-32 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <div className="mt-3 h-4 w-40 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProductSkeletonGrid count={8} />
      </div>
    </main>
  );
}
