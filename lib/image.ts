export const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=900&auto=format&fit=crop";

const allowedRemoteHosts = ["images.unsplash.com", "r2.cloudflarestorage.com", "r2.dev"];

export function isAllowedProductImageUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return allowedRemoteHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return value.startsWith("/icons/");
  }
}

export function safeProductImageUrl(value?: string | null) {
  if (!value) return PRODUCT_IMAGE_FALLBACK;
  return isAllowedProductImageUrl(value) ? value : PRODUCT_IMAGE_FALLBACK;
}
