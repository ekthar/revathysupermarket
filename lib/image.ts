export const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=900&auto=format&fit=crop";

/**
 * Converts various image URL formats to direct image URLs.
 * Supports:
 * - Unsplash page URLs: https://unsplash.com/photos/SLUG-ID → https://images.unsplash.com/SLUG-ID?w=800&auto=format&fit=crop
 * - Unsplash direct URLs: https://images.unsplash.com/photo-xxx (pass through)
 * - Any other HTTPS URL (pass through)
 * - Pexels page URLs: https://www.pexels.com/photo/SLUG-ID/ → pass through (need API)
 */
export function normalizeImageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Unsplash page URL → direct image URL
  // Pattern: https://unsplash.com/photos/[optional-title-slug-]PHOTO_ID
  // Example: https://unsplash.com/photos/green-emoji-standee--T-9-x7ypCI
  // Example: https://unsplash.com/photos/-T-9-x7ypCI
  const unsplashPageMatch = trimmed.match(
    /^https?:\/\/(www\.)?unsplash\.com\/photos\/(.+?)(?:\?.*)?$/
  );
  if (unsplashPageMatch) {
    const photoSlug = unsplashPageMatch[2];
    // The photo ID is the last segment. Unsplash slugs are like "description-PHOTOID"
    // Photo IDs are typically 11 chars (alphanumeric + _ + -) 
    // But some have leading dashes like -T-9-x7ypCI
    // Use the full slug as the ID for the source URL
    return `https://images.unsplash.com/${photoSlug}?w=800&auto=format&fit=crop`;
  }

  // Already a direct unsplash image URL - ensure it has sizing params
  if (trimmed.startsWith("https://images.unsplash.com/")) {
    const url = new URL(trimmed);
    if (!url.searchParams.has("w")) url.searchParams.set("w", "800");
    if (!url.searchParams.has("auto")) url.searchParams.set("auto", "format");
    if (!url.searchParams.has("fit")) url.searchParams.set("fit", "crop");
    return url.toString();
  }

  // Pixabay direct URLs - pass through
  // Imgur URLs - pass through  
  // Any other URL - pass through as-is
  return trimmed;
}

export function isAllowedProductImageUrl(value: string) {
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

export function safeProductImageUrl(value?: string | null) {
  if (!value) return PRODUCT_IMAGE_FALLBACK;
  // Normalize first (converts page URLs to image URLs)
  const normalized = normalizeImageUrl(value);
  return isAllowedProductImageUrl(normalized) ? normalized : PRODUCT_IMAGE_FALLBACK;
}
