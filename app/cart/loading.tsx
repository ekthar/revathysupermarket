export default function CartLoading() {
  return (
    <div className="space-y-4 px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
        </div>
        <div className="relative h-7 w-24 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
        </div>
      </div>

      {/* Cart items */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex h-16 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="relative h-3.5 w-2/3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
              </div>
              <div className="relative h-2.5 w-1/3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
              </div>
            </div>
            <div className="relative h-8 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
            </div>
          </div>
        ))}
      </div>

      {/* Bill details card */}
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="relative h-3.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
            </div>
            <div className="relative h-3.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
            </div>
          </div>
        ))}
      </div>

      {/* Checkout button */}
      <div className="relative h-[54px] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
      </div>
    </div>
  );
}
