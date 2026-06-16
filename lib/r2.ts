export function getR2PublicUrl(key: string) {
  const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!baseUrl) return key;
  return `${baseUrl.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}
