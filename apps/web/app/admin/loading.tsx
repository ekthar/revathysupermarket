/**
 * Admin dashboard skeleton loader.
 * Shows metric cards + chart placeholders while heavy DB queries run.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="space-y-1">
        <div className="h-7 w-52 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-72 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="admin-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="h-8 w-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Order pipeline */}
      <div className="admin-card p-5">
        <div className="h-5 w-32 rounded bg-slate-100 dark:bg-slate-800 animate-pulse mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 min-w-[120px] rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-6 w-8 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart + Recent orders */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-5">
        {/* Chart skeleton */}
        <div className="admin-card p-5">
          <div className="h-5 w-36 rounded bg-slate-100 dark:bg-slate-800 animate-pulse mb-4" />
          <div className="h-48 w-full rounded-xl bg-slate-50 dark:bg-slate-800/50 animate-pulse" />
        </div>

        {/* Recent orders skeleton */}
        <div className="admin-card p-5">
          <div className="h-5 w-28 rounded bg-slate-100 dark:bg-slate-800 animate-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 w-24 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="h-4 w-12 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
