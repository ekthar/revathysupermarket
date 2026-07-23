/**
 * Deep Link Router — resolves deep link URLs to internal navigation paths.
 *
 * Handles:
 * - Custom scheme links: revathy://products/fresh-mango
 * - Universal/App Links: https://revathysupermarket.vercel.app/products/fresh-mango
 * - Push notification deep links: /track/order-123
 * - Shared content links: /products?q=mango
 *
 * Used by:
 * - Native push notification tap handler (native-push.ts)
 * - App lifecycle resume handler (app opened from background via link)
 * - Capacitor App.addListener("appUrlOpen") handler
 *
 * The router normalizes various URL formats into a clean internal path
 * that can be passed to Next.js router.push().
 */

const CUSTOM_SCHEME = "revathy://";
const WEB_ORIGINS = [
  "https://revathysupermarket.vercel.app",
  "https://www.revathysupermarket.in",
  "http://localhost:3000",
];

export interface DeepLinkResult {
  /** Normalized internal path (e.g., "/products/fresh-mango") */
  path: string;
  /** Query parameters extracted from the URL */
  params: Record<string, string>;
  /** Whether this link requires authentication */
  requiresAuth: boolean;
}

/**
 * Parse a deep link URL into an internal navigation path.
 *
 * @param url - The incoming URL (custom scheme, https, or relative path)
 * @returns Parsed deep link result with normalized path
 */
export function parseDeepLink(url: string): DeepLinkResult {
  let path = url;
  let params: Record<string, string> = {};

  // Handle custom scheme: revathy://products/mango → /products/mango
  if (url.startsWith(CUSTOM_SCHEME)) {
    path = "/" + url.slice(CUSTOM_SCHEME.length);
  }
  // Handle full web URLs: https://revathysupermarket.vercel.app/products/mango → /products/mango
  else if (url.startsWith("http")) {
    try {
      const parsed = new URL(url);
      // Verify it's our domain
      if (WEB_ORIGINS.some((origin) => url.startsWith(origin))) {
        path = parsed.pathname + parsed.search;
      } else {
        // External URL — don't navigate
        return { path: "/", params: {}, requiresAuth: false };
      }
      // Extract query params
      parsed.searchParams.forEach((value, key) => { params[key] = value; });
    } catch {
      path = "/";
    }
  }
  // Handle relative paths: /products/mango?ref=share
  else if (url.startsWith("/")) {
    const qIdx = url.indexOf("?");
    if (qIdx > -1) {
      path = url.slice(0, qIdx);
      const searchParams = new URLSearchParams(url.slice(qIdx));
      searchParams.forEach((value, key) => { params[key] = value; });
    }
  }

  // Normalize path (remove trailing slash, double slashes)
  path = path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

  // Determine if auth is required
  const requiresAuth = isAuthRequiredRoute(path);

  return { path, params, requiresAuth };
}

/**
 * Check if a route requires authentication.
 */
function isAuthRequiredRoute(path: string): boolean {
  const authRoutes = [
    "/checkout",
    "/dashboard",
    "/account",
    "/track",
    "/orders",
  ];
  return authRoutes.some((route) => path.startsWith(route));
}

/**
 * Generate a shareable deep link URL for a given internal path.
 *
 * @param path - Internal path (e.g., "/products/fresh-mango")
 * @param options - Additional options
 * @returns Full shareable URL
 */
export function generateDeepLink(
  path: string,
  options?: {
    /** Use custom scheme (for native-to-native sharing) */
    useCustomScheme?: boolean;
    /** Additional query params to append */
    params?: Record<string, string>;
    /** UTM/tracking source */
    source?: string;
  }
): string {
  const { useCustomScheme = false, params = {}, source } = options || {};

  // Add tracking source
  if (source) params.ref = source;

  const queryString = Object.keys(params).length > 0
    ? "?" + new URLSearchParams(params).toString()
    : "";

  if (useCustomScheme) {
    // Remove leading slash for custom scheme
    const schemePath = path.startsWith("/") ? path.slice(1) : path;
    return `${CUSTOM_SCHEME}${schemePath}${queryString}`;
  }

  return `${WEB_ORIGINS[0]}${path}${queryString}`;
}
