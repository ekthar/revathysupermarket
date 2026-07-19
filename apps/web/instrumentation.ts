/**
 * Next.js Instrumentation — Sentry server + edge initialization
 * Called once when the server/edge runtime starts.
 */

export async function register() {
  if (process.env.SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      const Sentry = await import("@sentry/nextjs");
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0.2,
        environment: process.env.NODE_ENV,
      });
    }

    if (process.env.NEXT_RUNTIME === "edge") {
      const Sentry = await import("@sentry/nextjs");
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0.2,
        environment: process.env.NODE_ENV,
      });
    }
  }
}
