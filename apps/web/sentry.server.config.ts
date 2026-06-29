/**
 * Sentry server-side configuration.
 * 
 * Initializes Sentry for Node.js server error tracking in API routes and SSR.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),

  // Release tagged with git SHA
  release: process.env.NEXT_PUBLIC_BUILD_SHA || "development",

  // Environment
  environment: process.env.NODE_ENV,

  // Performance monitoring — lower sample in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Don't send PII
  sendDefaultPii: false,
});
