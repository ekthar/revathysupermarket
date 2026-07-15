"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

interface AdminErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Reusable error boundary for admin pages.
 * Use as the default export in any admin `error.tsx` file:
 *
 * ```tsx
 * export { AdminErrorBoundary as default } from "@/components/admin/shared/AdminErrorBoundary";
 * ```
 *
 * Or with custom messaging:
 * ```tsx
 * export default function ErrorPage(props) {
 *   return <AdminErrorBoundary {...props} context="loading orders" />;
 * }
 * ```
 */
export function AdminErrorBoundary({
  error,
  reset,
  context,
}: AdminErrorBoundaryProps & { context?: string }) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200/50 bg-amber-50/50 px-6 py-16 text-center dark:border-amber-900/30 dark:bg-amber-950/20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
        <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
        Something went wrong
      </h3>
      <p className="mt-1 max-w-sm text-sm text-amber-700 dark:text-amber-300">
        {context
          ? `An error occurred while ${context}. Please try again.`
          : "An unexpected error occurred. Please try again."}
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-4 max-w-lg overflow-x-auto rounded-lg bg-amber-100/80 px-4 py-2 text-left text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}

// Default export for direct use in error.tsx files
export default AdminErrorBoundary;
