"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ShoppingBag } from "lucide-react";

export default function OffersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[offers error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>

      <h1 className="mt-6 font-display text-2xl font-black text-neutral-900 dark:text-white">
        Couldn&apos;t load offers
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
        We had trouble fetching the latest deals. Please try again or browse our
        products in the meantime.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={reset}
          aria-label="Retry loading offers"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.97]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/categories"
          aria-label="Browse products"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-200 text-sm font-bold text-neutral-700 transition-transform active:scale-[0.97] dark:border-neutral-700 dark:text-neutral-300"
        >
          <ShoppingBag className="h-4 w-4" />
          Browse Products
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
