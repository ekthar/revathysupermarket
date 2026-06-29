import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative">
        <span className="font-display text-[120px] font-black leading-none text-neutral-100 dark:text-neutral-800 select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="h-12 w-12 text-neutral-400" />
        </div>
      </div>

      <h1 className="mt-4 font-display text-2xl font-black text-neutral-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.97]"
        >
          <Home className="h-4 w-4" />
          Go to homepage
        </Link>
        <Link
          href="/products"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 transition-transform active:scale-[0.97]"
        >
          <Search className="h-4 w-4" />
          Browse products
        </Link>
      </div>
    </main>
  );
}
