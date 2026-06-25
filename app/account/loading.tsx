export default function AccountLoading() {
  return (
    <div className="space-y-5 px-4 pt-4 pb-24">
      {/* Profile card */}
      <div className="relative h-40 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
      </div>

      {/* Settings groups */}
      {Array.from({ length: 2 }).map((_, groupIdx) => (
        <div
          key={groupIdx}
          className="overflow-hidden rounded-lg border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          {Array.from({ length: 4 }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="flex h-12 items-center gap-3 border-b border-neutral-100 px-4 last:border-b-0 dark:border-neutral-800"
            >
              <div className="relative h-5 w-5 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
              </div>
              <div className="relative h-3.5 w-28 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
