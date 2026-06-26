import crypto from "crypto";
export { safeCallbackUrl } from "@/lib/safe-redirect";

const IMAGE_TYPES = {
  "image/jpeg": { extension: "jpg", matches: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", matches: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  "image/webp": { extension: "webp", matches: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" }
} as const;

export function verifyHmacSignature(payload: string, signature: string | null, secret: string | undefined) {
  if (!signature || !secret || !signature.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function validateImageFile(file: File, maxBytes: number) {
  if (file.size <= 0 || file.size > maxBytes) throw new Error(`Image must be smaller than ${Math.round(maxBytes / 1024 / 1024)}MB.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = Object.entries(IMAGE_TYPES).find(([, config]) => config.matches(bytes));
  if (!detected) throw new Error("Only JPEG, PNG, and WebP images are allowed.");
  const [contentType, config] = detected;
  return { bytes: Buffer.from(bytes), contentType, extension: config.extension };
}

export function allowedExternalImageUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const configured = [process.env.CLOUDFLARE_R2_PUBLIC_URL, process.env.NEXT_PUBLIC_IMAGE_HOST]
      .flatMap((item) => item ? [new URL(item).hostname] : []);
    return url.hostname === "images.unsplash.com" || url.hostname.endsWith(".amazonaws.com") || configured.includes(url.hostname);
  } catch {
    return false;
  }
}
