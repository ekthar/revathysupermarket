import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-sm flex-col items-center justify-center px-6 py-16 text-center">
      <span className="font-display text-[100px] font-black leading-none text-neutral-100 dark:text-neutral-800 select-none">
        404
      </span>

      <h1 className="mt-2 font-display text-xl font-black text-neutral-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
        This page doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full">
        <Link
          href="/"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-900 dark:bg-white text-sm font-bold text-white dark:text-neutral-900 transition-transform press"
        >
          <Home className="h-4 w-4" />
          Go to homepage
        </Link>
        <Link
          href="/products"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 transition-transform press"
        >
          <Search className="h-4 w-4" />
          Browse products
        </Link>
      </div>
    </main>
  );
}
