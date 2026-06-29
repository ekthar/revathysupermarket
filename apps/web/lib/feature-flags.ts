/**
 * Feature flags via environment variables.
 * 
 * All flags default to enabled (true) unless explicitly set to "0" or "false".
 * This allows killing features instantly in production without code changes.
 * 
 * Usage:
 *   import { flags } from "@/lib/feature-flags";
 *   if (flags.intro) { ... }
 * 
 * Client-side flags use NEXT_PUBLIC_ prefix.
 * Server-side flags use plain env vars.
 */

function isEnabled(value: string | undefined, defaultValue = true): boolean {
  if (value === undefined || value === "") return defaultValue;
  return value !== "0" && value !== "false";
}

/**
 * Client-side feature flags (available in browser and server).
 */
export const flags = {
  /** Cinematic intro experience */
  intro: isEnabled(process.env.NEXT_PUBLIC_FEATURE_INTRO),

  /** Install app prompt */
  installPrompt: isEnabled(process.env.NEXT_PUBLIC_ENABLE_INSTALL_PROMPT),

  /** Loyalty rewards system */
  rewards: isEnabled(process.env.NEXT_PUBLIC_ENABLE_REWARDS),

  /** Delivery time slots */
  deliverySlots: isEnabled(process.env.NEXT_PUBLIC_ENABLE_DELIVERY_SLOTS),

  /** Offline banner and SW caching */
  offlineSupport: isEnabled(process.env.NEXT_PUBLIC_FEATURE_OFFLINE, true),

  /** Push notifications */
  pushNotifications: isEnabled(process.env.NEXT_PUBLIC_FEATURE_PUSH, true),
} as const;

/**
 * Server-only feature flags (not exposed to client).
 */
export const serverFlags = {
  /** Sentry error tracking */
  sentry: isEnabled(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN ? "1" : undefined, false),

  /** Structured logging via pino */
  structuredLogs: isEnabled(process.env.FEATURE_STRUCTURED_LOGS, true),

  /** Rate limiting */
  rateLimit: isEnabled(process.env.FEATURE_RATE_LIMIT, true),

  /** Turnstile bot protection */
  turnstile: isEnabled(process.env.TURNSTILE_SECRET_KEY ? "1" : undefined, false),
} as const;

export type FeatureFlag = keyof typeof flags;
export type ServerFeatureFlag = keyof typeof serverFlags;
