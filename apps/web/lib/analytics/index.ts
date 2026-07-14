/**
 * Analytics abstraction layer.
 *
 * Provides a clean interface for tracking events across the app.
 * Delegates to the PostHog provider. All methods are no-ops when
 * analytics is not initialized (env vars missing or flag disabled).
 *
 * Client-side initialization is gated by:
 *  - NEXT_PUBLIC_POSTHOG_KEY env var being present
 *  - NEXT_PUBLIC_POSTHOG_HOST env var being present
 */

import * as posthog from "./posthog";
import type { AnalyticsEventName, AnalyticsEventMap } from "./events";

/**
 * Check if analytics is configured (client-side check via env vars).
 */
export function isAnalyticsConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_POSTHOG_KEY &&
    process.env.NEXT_PUBLIC_POSTHOG_HOST
  );
}

/**
 * Initialize analytics. Call once on app mount.
 * No-op if env vars are not present.
 */
export async function initAnalytics(): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host) return;

  await posthog.init(apiKey, host);
}

/**
 * Track a typed analytics event.
 * No-op if analytics is not initialized.
 */
export function trackEvent<E extends AnalyticsEventName>(
  event: E,
  properties: E extends keyof AnalyticsEventMap ? AnalyticsEventMap[E] : Record<string, any>,
): void {
  posthog.capture(event, properties as Record<string, any>);
}

/**
 * Identify the current user for analytics.
 * No-op if analytics is not initialized.
 */
export function identifyUser(
  userId: string,
  traits?: Record<string, any>,
): void {
  posthog.identify(userId, traits);
}

/**
 * Reset user identity (e.g., on logout).
 * No-op if analytics is not initialized.
 */
export function resetUser(): void {
  posthog.reset();
}

/**
 * Check if analytics is ready to track events.
 */
export function isAnalyticsReady(): boolean {
  return posthog.isReady();
}
