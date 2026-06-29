/**
 * Shared fetcher with rate-limit (429) handling.
 * 
 * Intercepts 429 responses and shows a non-spammy countdown toast.
 * Used by React Query and direct API calls throughout the client.
 */

type FetcherOptions = RequestInit & {
  /** Suppress the rate-limit toast (e.g. for background refetches) */
  suppressRateLimitToast?: boolean;
};

let lastToastTime = 0;
const TOAST_DEBOUNCE_MS = 5_000; // Don't spam toasts more than once every 5s

/**
 * Show a rate-limit toast using sonner (imported dynamically to avoid SSR issues).
 */
async function showRateLimitToast(retryAfter: number) {
  const now = Date.now();
  if (now - lastToastTime < TOAST_DEBOUNCE_MS) return;
  lastToastTime = now;

  // Dynamic import to keep this tree-shakeable on server
  const { toast } = await import("sonner");
  toast.error("Too many requests", {
    description: `Please wait ${retryAfter}s before trying again.`,
    duration: Math.min(retryAfter * 1000, 10_000),
    id: "rate-limit-toast", // Prevents stacking
  });
}

/**
 * Enhanced fetch wrapper that handles rate limiting gracefully.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: FetcherOptions = {}
): Promise<T> {
  const { suppressRateLimitToast, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({})) as {
      retryAfter?: number;
      error?: string;
    };
    const retryAfter = data.retryAfter ??
      (Number(response.headers.get("Retry-After")) || 60);

    if (!suppressRateLimitToast) {
      showRateLimitToast(retryAfter);
    }

    const error = new Error(data.error || "RATE_LIMITED") as Error & {
      status: number;
      retryAfter: number;
    };
    error.status = 429;
    error.retryAfter = retryAfter;
    throw error;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: "Request failed" })) as {
      error?: string;
    };
    const error = new Error(data.error || `HTTP ${response.status}`) as Error & {
      status: number;
    };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

/**
 * JSON fetcher for React Query (SWR-compatible signature).
 */
export function queryFetcher<T = unknown>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: "GET", suppressRateLimitToast: true });
}
