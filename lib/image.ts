export const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=900&auto=format&fit=crop";

/**
 * Converts various image page URLs to direct image URLs.
 * 
 * Supported conversions:
 * - Unsplash page: https://unsplash.com/photos/SLUG → https://images.unsplash.com/SLUG?w=800&auto=format&fit=crop
 * - Unsplash direct: https://images.unsplash.com/photo-xxx (pass through, add params)
 * - Any other HTTPS URL: pass through as-is
 */
export function normalizeImageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Unsplash page URL → direct image URL via unsplash source
  // Patterns:
  //   https://unsplash.com/photos/green-emoji-standee--T-9-x7ypCI
  //   https://unsplash.com/photos/-T-9-x7ypCI
  //   https://www.unsplash.com/photos/some-slug
  const unsplashPageMatch = trimmed.match(
    /^https?:\/\/(www\.)?unsplash\.com\/photos\/(.+?)(?:\?.*)?$/
  );
  if (unsplashPageMatch) {
    const slug = unsplashPageMatch[2];
    // Extract the photo ID from slug (last part after the last hyphen group for standard IDs)
    // Unsplash photo IDs are 11 chars: alphanumeric, underscore, hyphen
    // For slugged URLs like "green-emoji-standee--T-9-x7ypCI", the ID is at the end
    // Use the source.unsplash.com redirect which handles slugs properly
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

/**
 * Checks if a URL is allowed as a product image.
 * Rejects: non-HTTPS, localhost, admin/api paths.
 * Allows: any public HTTPS URL, /icons/ paths.
 */
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
 * Normalizes the URL first (converts page URLs to direct image URLs),
 * then validates it. Falls back to placeholder if invalid.
 * Also handles bare R2 keys (filenames without full URL) by prefixing with R2 public URL.
 */
export function safeProductImageUrl(value?: string | null) {
  if (!value) return PRODUCT_IMAGE_FALLBACK;
  
  // If it looks like a bare filename/key (no protocol), try to construct full R2 URL
  if (!value.startsWith("http") && !value.startsWith("/icons/")) {
    const r2Base = typeof process !== "undefined" && process.env?.CLOUDFLARE_R2_PUBLIC_URL;
    if (r2Base) {
      const fullUrl = `${r2Base.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
      return fullUrl;
    }
    // Next.js client-side: check for NEXT_PUBLIC variant
    const clientR2Base = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (clientR2Base) {
      return `${clientR2Base.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
    }
    // No R2 URL configured - can't resolve this key, use fallback
    return PRODUCT_IMAGE_FALLBACK;
  }

  const normalized = normalizeImageUrl(value);
  if (!normalized) return PRODUCT_IMAGE_FALLBACK;
  return isAllowedProductImageUrl(normalized) ? normalized : PRODUCT_IMAGE_FALLBACK;
}
