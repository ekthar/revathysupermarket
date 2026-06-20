/**
 * Construct full public URL for an R2 object key.
 * 
 * Priority:
 * 1. CLOUDFLARE_R2_PUBLIC_URL (custom domain or r2.dev URL you configure)
 * 2. Constructed from account ID: https://{CLOUDFLARE_R2_BUCKET}.{ACCOUNT_ID}.r2.dev/{key}
 * 3. Returns key as-is (will fail - indicates misconfiguration)
 * 
 * IMPORTANT: You MUST set CLOUDFLARE_R2_PUBLIC_URL in your Vercel env vars.
 * Get it from: Cloudflare Dashboard > R2 > Your Bucket > Settings > Public access > r2.dev subdomain
 */
export function getR2PublicUrl(key: string) {
  // Option 1: Explicit public URL configured (preferred)
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
  }

  // Option 2: Construct from account ID + bucket (r2.dev subdomain)
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  if (accountId && bucket) {
    // R2 public dev URL format: https://pub-{hash}.r2.dev/{key}
    // But we can't derive the pub hash from account ID alone.
    // Use the direct S3-compatible URL as fallback (requires public bucket access enabled)
    return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key.replace(/^\//, "")}`;
  }

  // No configuration available - return key (will show broken image)
  console.error(`[R2] CLOUDFLARE_R2_PUBLIC_URL not configured! Image key "${key}" cannot be resolved to a URL.`);
  return key;
}
