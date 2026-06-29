export default function ProductDetailLoading() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-24">
        {/* Product image skeleton */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square w-full rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          <div className="space-y-4 py-4">
            {/* Category */}
            <div className="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            {/* Title */}
            <div className="h-8 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            {/* Price */}
            <div className="h-6 w-32 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            {/* Description */}
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            </div>
            {/* Add to cart button */}
            <div className="h-12 w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse mt-8" />
          </div>
        </div>
        {/* Related products heading */}
        <div className="h-6 w-48 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse mt-12" />
        {/* Related products grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
