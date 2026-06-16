export const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=900&auto=format&fit=crop";

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
  return isAllowedProductImageUrl(value) ? value : PRODUCT_IMAGE_FALLBACK;
}
