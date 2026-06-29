/**
 * Sentry client-side configuration.
 * 
 * Initializes Sentry for browser error tracking.
 * Tagged with git SHA release for sourcemap association.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  // Release tagged with git SHA (set during build)
  release: process.env.NEXT_PUBLIC_BUILD_SHA || "development",

  // Environment
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay for error reproduction (1% of sessions, 100% on error)
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Don't send errors in development unless DSN is explicitly set
  beforeSend(event) {
    if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }
    return event;
  },
});
