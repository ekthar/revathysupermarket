"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, trackEvent, isAnalyticsConfigured } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

/**
 * AnalyticsProvider - Client component that initializes PostHog analytics.
 *
 * Only initializes when NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST
 * env vars are present. Automatically tracks page_view events on route changes.
 *
 * Renders children only (no extra DOM). Graceful no-op if not configured.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize analytics on mount
  useEffect(() => {
    if (!isAnalyticsConfigured()) return;
    initAnalytics().catch(() => {
      // Silently fail - analytics should never break the app
    });
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (!isAnalyticsConfigured()) return;

    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
      url: url || "/",
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      title: typeof document !== "undefined" ? document.title : undefined,
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
