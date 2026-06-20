/**
 * Construct full public URL for an R2 object key.
 * If CLOUDFLARE_R2_PUBLIC_URL is not configured, prepends NEXT_PUBLIC_R2_PUBLIC_URL.
 * If neither is set, returns the key as-is (will need fallback handling in image components).
 */
export function getR2PublicUrl(key: string) {
  const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!baseUrl) {
    // No public URL configured - return key prefixed with a marker so we know it's incomplete
    console.warn(`[R2] CLOUDFLARE_R2_PUBLIC_URL not set. Image key "${key}" will not resolve.`);
    return key;
  }
  return `${baseUrl.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}
