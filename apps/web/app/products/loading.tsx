/**
 * Products page skeleton loader.
 * Renders instantly while the server fetches products from DB.
 * Matches the actual page layout to prevent CLS (Cumulative Layout Shift).
 */
export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header area */}
      <section className="overflow-hidden px-4 pb-1 pt-8 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-40 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          <div className="mt-2 h-4 w-28 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        </div>
      </section>

      {/* Category pills skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 w-20 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
              <div className="aspect-[4/3.2] bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                <div className="flex items-center justify-between pt-1">
                  <div className="h-5 w-14 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                  <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
