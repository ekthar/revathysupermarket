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

  // R2/cloudflare URL without https:// prefix - fix it
  if (trimmed.match(/^[\w-]+\.r2\.cloudflarestorage\.com\//)) {
    return `https://${trimmed}`;
  }
  if (trimmed.match(/^[\w-]+\.r2\.dev\//)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export function isAllowedProductImageUrl(value: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const configuredHosts = [process.env.NEXT_PUBLIC_R2_PUBLIC_URL, process.env.NEXT_PUBLIC_IMAGE_HOST]
      .flatMap((item) => {
        if (!item) return [];
        try { return [new URL(item).hostname]; } catch { return []; }
      });
    return url.hostname === "images.unsplash.com" || url.hostname.endsWith(".r2.cloudflarestorage.com") || url.hostname.endsWith(".r2.dev") || url.hostname.endsWith(".amazonaws.com") || configuredHosts.includes(url.hostname);
  } catch {
    return value.startsWith("/icons/");
  }
}

/**
 * Returns a safe image URL for rendering.
 * Handles:
 * - Bare R2 keys (like "products/uuid.jpg") → prefix with R2 public URL
 * - R2 URLs without https:// → add https://
 * - Unsplash page URLs → convert to direct image URL
 * - Invalid/empty → fallback placeholder
 */
export function safeProductImageUrl(value?: string | null) {
  if (!value) return PRODUCT_IMAGE_FALLBACK;

  // If it looks like a relative path / R2 key (no protocol, no domain pattern)
  if (!value.startsWith("http") && !value.startsWith("/icons/") && !value.match(/^[\w-]+\.(r2\.(cloudflarestorage\.com|dev))\//)) {
    const r2Base = typeof process !== "undefined"
      ? (process.env?.CLOUDFLARE_R2_PUBLIC_URL || process.env?.NEXT_PUBLIC_R2_PUBLIC_URL)
      : undefined;
    if (r2Base) {
      return `${String(r2Base).replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
    }
    return PRODUCT_IMAGE_FALLBACK;
  }

  const normalized = normalizeImageUrl(value);
  if (!normalized) return PRODUCT_IMAGE_FALLBACK;
  return isAllowedProductImageUrl(normalized) ? normalized : PRODUCT_IMAGE_FALLBACK;
}
