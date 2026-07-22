/**
 * Native Share — unified share API for Capacitor and web.
 *
 * Uses the Web Share API (which Capacitor's WebView supports natively
 * on both Android and iOS). Falls back gracefully if unavailable.
 *
 * On native, navigator.share() triggers the system share sheet
 * (same as UIActivityViewController on iOS / Intent.ACTION_SEND on Android).
 */

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

/**
 * Share content via the native system share sheet.
 *
 * @returns true if shared successfully, false if cancelled or unavailable
 */
export async function nativeShare(options: ShareOptions): Promise<boolean> {
  // navigator.share is supported in Capacitor WebView on both platforms
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return true;
    } catch (err: any) {
      // User cancelled the share sheet — not an error
      if (err?.name === "AbortError") return false;
      return false;
    }
  }

  // Fallback: copy to clipboard
  if (options.url && typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(options.url);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Check if native share is available on this platform.
 */
export function canShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}
