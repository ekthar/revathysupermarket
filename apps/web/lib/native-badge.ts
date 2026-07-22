/**
 * Native Badge — set/clear the app icon badge count.
 *
 * On native:
 * - iOS: Sets the app icon badge number (via @capacitor/badge)
 * - Android: Sets badge on supported launchers (Samsung, Huawei, Xiaomi, etc.)
 *
 * On web: Uses navigator.setAppBadge (PWA Badge API, Chrome 81+).
 *
 * Usage:
 *   import { setBadgeCount, clearBadge } from "@/lib/native-badge";
 *
 *   setBadgeCount(3);  // Show "3" on app icon
 *   clearBadge();      // Remove badge
 */

import { isNative } from "@/lib/native-bridge";

/**
 * Set the app icon badge count.
 *
 * @param count - Number to display on the badge (0 clears it)
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (count <= 0) {
    await clearBadge();
    return;
  }

  if (isNative) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Badge } = await import(/* webpackIgnore: true */ "@capacitor/badge");
      await Badge.set({ count });
      return;
    } catch {}
  }

  // Web fallback: PWA Badge API
  if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
    try {
      await (navigator as any).setAppBadge(count);
    } catch {}
  }
}

/**
 * Clear the app icon badge.
 */
export async function clearBadge(): Promise<void> {
  if (isNative) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Badge } = await import(/* webpackIgnore: true */ "@capacitor/badge");
      await Badge.clear();
      return;
    } catch {}
  }

  // Web fallback: PWA Badge API
  if (typeof navigator !== "undefined" && "clearAppBadge" in navigator) {
    try {
      await (navigator as any).clearAppBadge();
    } catch {}
  }
}

/**
 * Get the current badge count.
 */
export async function getBadgeCount(): Promise<number> {
  if (isNative) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Badge } = await import(/* webpackIgnore: true */ "@capacitor/badge");
      const result = await Badge.get();
      return result.count;
    } catch {}
  }

  return 0;
}

/**
 * Check if badge setting is supported on this device.
 */
export function isBadgeSupported(): boolean {
  if (isNative) return true;
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}
