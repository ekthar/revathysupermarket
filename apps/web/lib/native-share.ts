/**
 * Native Share — enhanced Web Share API for rich content sharing.
 *
 * Supports:
 * - Level 1: text + URL sharing (all browsers with navigator.share)
 * - Level 2: file/image sharing (Chrome 89+, Safari 15+, Edge 93+)
 * - Fallback: clipboard copy with formatted text
 *
 * Designed for grocery delivery context:
 * - Product sharing with price, description, deep link
 * - Order receipt sharing
 * - Referral link sharing
 */

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

export interface RichShareOptions extends ShareOptions {
  /** Product image URL to include as a shared file (Level 2) */
  imageUrl?: string;
  /** Product price for formatted share text */
  price?: string;
  /** Product category for context */
  category?: string;
}

/**
 * Share content via the native system share sheet.
 *
 * @returns "shared" if shared, "copied" if fell back to clipboard, "cancelled" if user dismissed
 */
export async function nativeShare(options: ShareOptions): Promise<"shared" | "copied" | "cancelled"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return "shared";
    } catch (err: any) {
      if (err?.name === "AbortError") return "cancelled";
      return "cancelled";
    }
  }

  // Fallback: copy to clipboard
  return copyToClipboard(options.url || options.text || "");
}

/**
 * Share a product with rich formatting.
 *
 * Generates a well-formatted share message with product details,
 * and attempts to include the product image if Web Share Level 2 is supported.
 *
 * Example share text:
 * "Check out Fresh Mango (₹120/kg) on Revathy Supermarket!
 *  https://revathysupermarket.vercel.app/products/fresh-mango"
 */
export async function shareProduct(options: RichShareOptions): Promise<"shared" | "copied" | "cancelled"> {
  const { title, text, url, imageUrl, price, category } = options;

  // Build rich share text
  const shareText = buildProductShareText({ title, price, category, text });

  // Try Level 2 share with image file
  if (imageUrl && canShareFiles()) {
    try {
      const imageFile = await fetchImageAsFile(imageUrl, title || "product");
      if (imageFile) {
        await navigator.share({
          title: title,
          text: shareText,
          url: url,
          files: [imageFile],
        });
        return "shared";
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return "cancelled";
      // Fall through to text-only share
    }
  }

  // Level 1 share (text + URL only)
  return nativeShare({ title, text: shareText, url });
}

/**
 * Share a referral/invite link.
 */
export async function shareReferral(options: {
  code: string;
  storeName: string;
  url: string;
}): Promise<"shared" | "copied" | "cancelled"> {
  const text = `Join me on ${options.storeName}! Use my referral code ${options.code} for a discount on your first order.`;
  return nativeShare({ title: `${options.storeName} Referral`, text, url: options.url });
}

/**
 * Check if native share is available on this platform.
 */
export function canShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

/**
 * Check if Web Share Level 2 (file sharing) is available.
 */
export function canShareFiles(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share && !!navigator.canShare;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function buildProductShareText(opts: {
  title?: string;
  price?: string;
  category?: string;
  text?: string;
}): string {
  const parts: string[] = [];

  if (opts.title) {
    parts.push(opts.price ? `${opts.title} (${opts.price})` : opts.title);
  }

  if (opts.text) {
    // Truncate description to ~100 chars for share
    const desc = opts.text.length > 100 ? opts.text.slice(0, 97) + "..." : opts.text;
    parts.push(desc);
  }

  return parts.join("\n") || "Check this out!";
}

async function fetchImageAsFile(imageUrl: string, name: string): Promise<File | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const blob = await response.blob();
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const fileName = `${name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.${ext}`;

    return new File([blob], fileName, { type: blob.type });
  } catch {
    return null;
  }
}

async function copyToClipboard(text: string): Promise<"copied" | "cancelled"> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      return "cancelled";
    }
  }
  return "cancelled";
}
