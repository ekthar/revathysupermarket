"use client";

interface AdminLoadingSkeletonProps {
  /** Layout variant */
  variant?: "list" | "dashboard" | "detail" | "table";
  /** Number of skeleton rows (for list/table) */
  rows?: number;
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-200/80 dark:bg-neutral-700/50 ${className || ""}`}
    />
  );
}

function SkeletonHeader() {
  return (
    <div className="rounded-2xl bg-neutral-100 p-6 dark:bg-neutral-800/50 sm:p-8">
      <Shimmer className="mb-2 h-3 w-20" />
      <Shimmer className="mb-2 h-8 w-64" />
      <Shimmer className="h-4 w-96 max-w-full" />
    </div>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <Shimmer className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-48" />
            <Shimmer className="h-3 w-32" />
          </div>
          <Shimmer className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <Shimmer className="mb-3 h-4 w-24" />
            <Shimmer className="mb-1 h-8 w-16" />
            <Shimmer className="h-3 w-32" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <Shimmer className="mb-4 h-5 w-32" />
          <Shimmer className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <Shimmer className="mb-4 h-5 w-32" />
          <Shimmer className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-100 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Shimmer className="h-6 w-48" />
            <Shimmer className="h-4 w-32" />
          </div>
          <Shimmer className="h-8 w-24 rounded-full" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Shimmer className="h-3 w-20" />
              <Shimmer className="h-5 w-40" />
            </div>
          ))}
        </div>
      </div>
      <ListSkeleton rows={3} />
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      {/* Table header */}
      <div className="flex items-center gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-neutral-100 px-4 py-3 last:border-0 dark:border-neutral-800"
        >
          {Array.from({ length: 5 }).map((_, j) => (
            <Shimmer key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminLoadingSkeleton({
  variant = "list",
  rows = 5,
}: AdminLoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      {variant === "list" && <ListSkeleton rows={rows} />}
      {variant === "dashboard" && <DashboardSkeleton />}
      {variant === "detail" && <DetailSkeleton />}
      {variant === "table" && <TableSkeleton rows={rows} />}
    </div>
  );
}
