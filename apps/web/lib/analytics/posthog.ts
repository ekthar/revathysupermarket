/**
 * PostHog client wrapper using dynamic script loading.
 *
 * Loads PostHog from CDN via a <script> tag at runtime. All methods
 * are no-ops if PostHog has not been initialized (graceful degradation).
 *
 * DO NOT import posthog-js as an npm package - this uses the CDN bundle.
 */

/** Minimal PostHog interface for the methods we use. */
interface PostHogInstance {
  init(apiKey: string, options?: Record<string, any>): void;
  capture(event: string, properties?: Record<string, any>): void;
  identify(distinctId: string, properties?: Record<string, any>): void;
  reset(): void;
}

let posthogInstance: PostHogInstance | null = null;
let initPromise: Promise<PostHogInstance | null> | null = null;

/**
 * Dynamically loads the PostHog script from CDN and initializes it.
 * Returns the PostHog instance or null if loading fails.
 */
function loadPostHogScript(apiKey: string, host: string): Promise<PostHogInstance | null> {
  return new Promise((resolve) => {
    // If already loaded on globalThis, reuse it
    if (typeof window !== "undefined" && (window as any).posthog) {
      const ph = (window as any).posthog as PostHogInstance;
      ph.init(apiKey, {
        api_host: host,
        loaded: () => resolve(ph),
        autocapture: false,
        capture_pageview: false,
        persistence: "localStorage",
      });
      resolve(ph);
      return;
    }

    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    // Create script element to load PostHog from CDN
    const script = document.createElement("script");
    script.src = "https://us-assets.i.posthog.com/static/array.js";
    script.async = true;

    script.onload = () => {
      const ph = (window as any).posthog as PostHogInstance | undefined;
      if (ph) {
        ph.init(apiKey, {
          api_host: host,
          autocapture: false,
          capture_pageview: false,
          persistence: "localStorage",
        });
        resolve(ph);
      } else {
        resolve(null);
      }
    };

    script.onerror = () => {
      resolve(null);
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize PostHog with the given API key and host.
 * Safe to call multiple times - subsequent calls are no-ops.
 */
export async function init(apiKey: string, host: string): Promise<void> {
  if (posthogInstance) return;
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = loadPostHogScript(apiKey, host);
  posthogInstance = await initPromise;
}

/**
 * Capture an analytics event. No-op if not initialized.
 */
export function capture(event: string, properties?: Record<string, any>): void {
  if (!posthogInstance) return;
  try {
    posthogInstance.capture(event, properties);
  } catch {
    // Silently fail - analytics should never break the app
  }
}

/**
 * Identify a user. No-op if not initialized.
 */
export function identify(userId: string, traits?: Record<string, any>): void {
  if (!posthogInstance) return;
  try {
    posthogInstance.identify(userId, traits);
  } catch {
    // Silently fail
  }
}

/**
 * Reset the current user identity. No-op if not initialized.
 */
export function reset(): void {
  if (!posthogInstance) return;
  try {
    posthogInstance.reset();
  } catch {
    // Silently fail
  }
}

/**
 * Check if PostHog is initialized and ready.
 */
export function isReady(): boolean {
  return posthogInstance !== null;
}
