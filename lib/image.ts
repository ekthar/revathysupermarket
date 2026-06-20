export const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=900&auto=format&fit=crop";

/**
 * Converts various image page URLs to direct image URLs.
 * - Unsplash page: https://unsplash.com/photos/SLUG → https://images.unsplash.com/SLUG?w=800&auto=format&fit=crop
 * - Unsplash direct: adds sizing params if missing
 * - Any other HTTPS URL: pass through
 */
export function normalizeImageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Unsplash page URL → direct image URL
  const unsplashPageMatch = trimmed.match(
    /^https?:\/\/(www\.)?unsplash\.com\/photos\/(.+?)(?:\?.*)?$/
  );
  if (unsplashPageMatch) {
    const slug = unsplashPageMatch[2];
    return `https://images.unsplash.com/${slug}?w=800&auto=format&fit=crop`;
  }

  // Already a direct unsplash image URL - ensure sizing params
  if (trimmed.startsWith("https://images.unsplash.com/")) {
    try {
      const url = new URL(trimmed);
      if (!url.searchParams.has("w")) url.searchParams.set("w", "800");
      if (!url.searchParams.has("auto")) url.searchParams.set("auto", "format");
      if (!url.searchParams.has("fit")) url.searchParams.set("fit", "crop");
      return url.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

export function isAllowedProductImageUrl(value: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) return false;
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return false;
    return true;
  } catch {
    return value.startsWith("/icons/");
  }
}

/**
 * Returns a safe image URL for rendering.
 * Handles: bare R2 keys, unsplash page URLs, invalid URLs → fallback.
 */
export function safeProductImageUrl(value?: string | null) {
  if (!value) return PRODUCT_IMAGE_FALLBACK;

  // Bare filename (R2 key without full URL) - try to prefix with R2 public URL
  if (!value.startsWith("http") && !value.startsWith("/icons/")) {
    const r2Base = typeof process !== "undefined" && (process.env?.CLOUDFLARE_R2_PUBLIC_URL || process.env?.NEXT_PUBLIC_R2_PUBLIC_URL);
    if (r2Base) {
      return `${String(r2Base).replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
    }
    return PRODUCT_IMAGE_FALLBACK;
  }

  const normalized = normalizeImageUrl(value);
  if (!normalized) return PRODUCT_IMAGE_FALLBACK;
  return isAllowedProductImageUrl(normalized) ? normalized : PRODUCT_IMAGE_FALLBACK;
}
