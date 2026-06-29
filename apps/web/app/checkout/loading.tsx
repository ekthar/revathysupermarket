/**
 * Checkout page skeleton loader.
 * Shows form-shaped placeholders while server fetches settings + addresses.
 */
export default function CheckoutLoading() {
  return (
    <main className="mx-auto max-w-5xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Header card skeleton */}
      <div className="rounded-xl bg-neutral-100/60 dark:bg-neutral-800/40 p-5 sm:p-7">
        <div className="h-3 w-32 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        <div className="mt-3 h-8 w-48 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        <div className="mt-3 h-4 w-full max-w-md rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
      </div>

      {/* Form skeleton */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Form fields */}
        <div className="space-y-5">
          {/* Address selector */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="h-4 w-28 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse mb-3" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Name + Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            <div className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          </div>

          {/* Address fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            <div className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            <div className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          </div>

          {/* Payment method */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="h-4 w-32 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse mb-3" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order summary */}
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-4">
            <div className="h-5 w-28 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                </div>
              </div>
            ))}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-2">
              <div className="h-4 w-full rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              <div className="h-6 w-28 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            </div>
            <div className="h-12 w-full rounded-2xl bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
