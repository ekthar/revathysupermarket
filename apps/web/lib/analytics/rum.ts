/**
 * Real User Monitoring (RUM) setup.
 *
 * This module provides a skeleton for initializing RUM via Sentry Performance.
 * The app already has @sentry/nextjs configured (see instrumentation.ts for the
 * server-side setup and sentry.client.config.ts for the browser-side init).
 *
 * -------------------------------------------------------------------
 * HOW TO CONFIGURE SENTRY PERFORMANCE FOR RUM:
 * -------------------------------------------------------------------
 *
 * Sentry's browser SDK (loaded by @sentry/nextjs) automatically captures:
 *   - Page load transactions (navigation timing, resource loading)
 *   - Client-side navigation transactions (route changes in Next.js App Router)
 *   - Long tasks and interaction-to-next-paint (INP)
 *
 * To enable performance monitoring, ensure these options are set in
 * sentry.client.config.ts:
 *
 *   Sentry.init({
 *     dsn: "...",
 *     tracesSampleRate: 0.2,  // Sample 20% of transactions in production
 *     replaysSessionSampleRate: 0.1,
 *     integrations: [
 *       Sentry.browserTracingIntegration(),
 *     ],
 *   });
 *
 * The instrumentation.ts file already handles server-side tracing for API
 * routes and server components.
 *
 * -------------------------------------------------------------------
 * CORE WEB VITALS TO TRACK:
 * -------------------------------------------------------------------
 *
 * The key metrics that affect user experience and SEO ranking:
 *
 *   - LCP (Largest Contentful Paint): Target < 2.5s
 *     Measures loading performance. For this app, the hero image or the first
 *     product card image is typically the LCP element.
 *
 *   - INP (Interaction to Next Paint): Target < 200ms
 *     Replaces FID. Measures responsiveness to all user interactions throughout
 *     the page lifecycle, not just the first input.
 *
 *   - CLS (Cumulative Layout Shift): Target < 0.1
 *     Measures visual stability. Image placeholders and skeleton states in this
 *     app help minimize CLS.
 *
 *   - TTFB (Time to First Byte): Target < 800ms
 *     Measures server responsiveness. Next.js streaming and ISR help here.
 *
 * -------------------------------------------------------------------
 * USING THE web-vitals LIBRARY WITH SENTRY:
 * -------------------------------------------------------------------
 *
 * The `web-vitals` package (already a transitive dependency via Next.js) can
 * report Core Web Vitals directly to Sentry:
 *
 *   import { onLCP, onINP, onCLS, onTTFB } from "web-vitals";
 *   import * as Sentry from "@sentry/nextjs";
 *
 *   function sendToSentry(metric) {
 *     Sentry.metrics.distribution(metric.name, metric.value, {
 *       unit: "millisecond",
 *       tags: {
 *         deviceClass: getDeviceClass(),
 *         connectionType: getConnectionType(),
 *       },
 *     });
 *   }
 *
 *   onLCP(sendToSentry);
 *   onINP(sendToSentry);
 *   onCLS(sendToSentry);
 *   onTTFB(sendToSentry);
 *
 * Note: Sentry's browserTracingIntegration already captures these metrics
 * automatically in newer SDK versions. The web-vitals approach is useful
 * if you need custom tagging or want to send to additional backends.
 *
 * -------------------------------------------------------------------
 * SEGMENTING BY DEVICE CLASS:
 * -------------------------------------------------------------------
 *
 * Device classification helps identify performance issues on low-end hardware:
 *
 *   function getDeviceClass(): "low" | "mid" | "high" {
 *     const cores = navigator.hardwareConcurrency || 2;
 *     const memory = (navigator as any).deviceMemory || 4; // GB
 *     if (cores <= 2 || memory <= 2) return "low";
 *     if (cores <= 4 || memory <= 4) return "mid";
 *     return "high";
 *   }
 *
 *   function getConnectionType(): string {
 *     const conn = (navigator as any).connection;
 *     if (!conn) return "unknown";
 *     return conn.effectiveType || "unknown"; // "4g", "3g", "2g", "slow-2g"
 *   }
 *
 * These values can be added as tags/context to Sentry transactions and web
 * vital measurements, enabling dashboards that filter by device tier.
 *
 * -------------------------------------------------------------------
 * REFERENCE:
 * -------------------------------------------------------------------
 *
 * - Server-side instrumentation: apps/web/instrumentation.ts
 * - Client Sentry config: apps/web/sentry.client.config.ts (if present)
 * - Sentry docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 * - web-vitals: https://github.com/GoogleChrome/web-vitals
 */

/**
 * Initialize Real User Monitoring.
 *
 * This is currently a documented no-op. Sentry Performance captures RUM data
 * automatically when configured via @sentry/nextjs (see instrumentation.ts).
 *
 * Call this function from _app or a root layout client component if you need
 * to add custom web-vitals reporting beyond what Sentry captures by default.
 */
export function initRUM(): void {
  // Sentry Performance is already initialized via @sentry/nextjs.
  // This function serves as the entry point for any additional RUM setup
  // (e.g., custom web-vitals reporting, device class segmentation).
  //
  // To activate custom reporting, uncomment and configure:
  //
  // if (typeof window === "undefined") return;
  //
  // import("web-vitals").then(({ onLCP, onINP, onCLS, onTTFB }) => {
  //   const reporter = (metric) => {
  //     // Send to Sentry metrics or a custom analytics endpoint
  //     console.debug("[RUM]", metric.name, metric.value);
  //   };
  //   onLCP(reporter);
  //   onINP(reporter);
  //   onCLS(reporter);
  //   onTTFB(reporter);
  // });
}
