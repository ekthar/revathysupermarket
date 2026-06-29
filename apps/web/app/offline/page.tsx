import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export const metadata = {
  title: "Offline | MSM Supermarket",
};

/**
 * Offline fallback page served by the service worker when navigation fails.
 * 
 * Designed to be:
 * - Friendly and informative
 * - Accessible (proper heading hierarchy, contrast, focus management)
 * - Lightweight (no client-side JS beyond link navigation)
 * - Cached as part of static assets in SW install
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-xl flex-col items-center justify-center px-6 text-center">
      {/* Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-6">
        <WifiOff className="h-9 w-9 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
      </div>

      {/* Heading */}
      <h1 className="font-display text-heading font-black text-foreground">
        You&apos;re offline
      </h1>

      {/* Description */}
      <p className="mt-3 text-body text-muted-foreground max-w-sm leading-relaxed">
        It looks like you&apos;ve lost your internet connection. Some previously viewed pages may still be available.
      </p>

      {/* Tips */}
      <div className="mt-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 p-5 text-left w-full max-w-sm">
        <p className="text-caption font-bold text-foreground mb-2">While you&apos;re offline:</p>
        <ul className="space-y-1.5 text-caption text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-secondary-500 mt-0.5" aria-hidden="true">&bull;</span>
            Recently viewed products may still load
          </li>
          <li className="flex items-start gap-2">
            <span className="text-secondary-500 mt-0.5" aria-hidden="true">&bull;</span>
            Your cart is saved locally
          </li>
          <li className="flex items-start gap-2">
            <span className="text-secondary-500 mt-0.5" aria-hidden="true">&bull;</span>
            Orders require an active connection
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-body transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Go home
        </Link>
        <button
          type="button"
          onClick={() => typeof window !== "undefined" && window.location.reload()}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl border border-border bg-background text-foreground font-bold text-body transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>

      {/* Connection status hint */}
      <p className="mt-6 text-micro text-muted-foreground">
        This page will refresh automatically when you reconnect.
      </p>

      {/* Auto-reload script when online */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.addEventListener('online',function(){window.location.reload()})`,
        }}
      />
    </main>
  );
}
