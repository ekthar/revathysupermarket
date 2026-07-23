"use client";

/**
 * Offline Detection Utilities
 *
 * Provides hooks and helpers to detect when the app is offline
 * and when data is being served from cache.
 */

/**
 * Check if a fetch response was served from the service worker cache.
 * The SW adds X-SW-Cache: offline header to cached responses.
 */
export function isFromCache(response: Response): boolean {
  return response.headers.get("X-SW-Cache") === "offline";
}

/**
 * Check if the browser is currently offline.
 */
export function isOffline(): boolean {
  if (typeof navigator === "undefined") return false;
  return !navigator.onLine;
}

/**
 * Register a callback for online/offline status changes.
 * Returns an unsubscribe function.
 */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/**
 * Register for Background Sync (cart mutations).
 * Called when the app goes offline with pending cart changes.
 */
export async function registerCartSync(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    if ("sync" in registration) {
      await (registration as any).sync.register("cart-sync");
    }
  } catch {
    // Background Sync not supported — queue will retry on its own
  }
}
