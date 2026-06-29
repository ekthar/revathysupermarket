"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>

      <h1 className="mt-6 font-display text-2xl font-black text-neutral-900 dark:text-white">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        We hit an unexpected issue. Your cart and account are safe.
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={reset}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.97]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 transition-transform active:scale-[0.97]"
        >
          <Home className="h-4 w-4" />
          Go home
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-micro text-neutral-400">
          Error ID: {error.digest}
        </p>
      )}
    </main>
  );
}
