/**
 * API Cache Headers — stale-while-revalidate pattern for instant repeat loads.
 *
 * Strategy:
 * - Browser: max-age=0 (always check freshness → SW intercepts)
 * - CDN/Edge: s-maxage=60 (serve cached for 1 min without hitting origin)
 * - Stale: stale-while-revalidate=300 (serve stale for 5 min while refreshing)
 *
 * This layered approach gives us:
 * 1. First visit: origin response (fresh data)
 * 2. Repeat within 60s: CDN serves instantly (no origin hit)
 * 3. Repeat within 5min: CDN serves stale + refreshes in background
 * 4. Offline: SW serves from its own cache (separate layer)
 *
 * Different presets for different data freshness requirements.
 */

export type CachePreset = "products" | "settings" | "categories" | "none";

const CACHE_HEADERS: Record<CachePreset, Record<string, string>> = {
  /** Products: moderate freshness (stock changes, but ok to be 60s stale) */
  products: {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300, max-age=0",
    "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    "Vary": "Accept-Encoding",
  },

  /** Store settings: rarely change (ok to cache longer) */
  settings: {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600, max-age=0",
    "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    "Vary": "Accept-Encoding",
  },

  /** Categories: change very rarely */
  categories: {
    "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600, max-age=0",
    "CDN-Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    "Vary": "Accept-Encoding",
  },

  /** No caching (user-specific data, mutations) */
  none: {
    "Cache-Control": "private, no-store",
  },
};

/**
 * Get cache headers for a given preset.
 * Apply to NextResponse: `NextResponse.json(data, { headers: getCacheHeaders("products") })`
 */
export function getCacheHeaders(preset: CachePreset): Record<string, string> {
  return CACHE_HEADERS[preset];
}
