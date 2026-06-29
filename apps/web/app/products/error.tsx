"use client";

import Link from "next/link";
import { RefreshCw, ShoppingBag } from "lucide-react";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[50dvh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30">
        <ShoppingBag className="h-7 w-7 text-amber-500" />
      </div>

      <h1 className="mt-5 font-display text-xl font-black text-neutral-900 dark:text-white">
        Could not load products
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Check your internet connection and try again.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white transition-transform active:scale-[0.97]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
        <Link
          href="/"
          className="flex h-11 items-center rounded-full border border-neutral-200 dark:border-neutral-700 px-5 text-sm font-bold text-neutral-600 dark:text-neutral-300 transition-transform active:scale-[0.97]"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
