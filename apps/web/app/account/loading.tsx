/**
 * Account page skeleton loader.
 * Matches the profile card + menu item layout to prevent CLS.
 */
export default function AccountLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-lg space-y-4 bg-background px-4 pb-28 pt-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="h-3 w-16 mx-auto rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-5 w-28 mx-auto rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </div>

      {/* Profile card skeleton */}
      <div className="rounded-xl bg-gradient-to-br from-secondary-500/20 to-teal-700/20 p-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/20 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 rounded bg-white/20 animate-pulse" />
            <div className="h-3.5 w-44 rounded bg-white/20 animate-pulse" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/10 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Wallet card skeleton */}
      <div className="rounded-lg bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            <div className="h-5 w-16 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Menu items skeleton */}
      <div className="rounded-lg bg-card shadow-sm overflow-hidden">
        <div className="px-4 pt-3.5 pb-1">
          <div className="h-3 w-20 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-t border-neutral-50 dark:border-neutral-800/50 first:border-0">
            <div className="h-9 w-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            <div className="flex-1 h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            <div className="h-3 w-12 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
