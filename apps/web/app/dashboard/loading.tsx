export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background px-4 pt-6 pb-24 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header skeleton */}
        <div className="h-8 w-48 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-4 w-64 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse mt-2" />

        {/* Order cards skeleton */}
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                <div className="h-6 w-20 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              </div>
              <div className="flex gap-3">
                <div className="h-14 w-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
