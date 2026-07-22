"use client";

/**
 * Offline Order Queue — Background Sync for order placement.
 *
 * When the user places an order while transitioning to offline (or with
 * flaky connectivity), the order payload is stored in the service worker
 * cache and a Background Sync event is registered. The SW will automatically
 * retry submission when connectivity returns.
 *
 * Flow:
 * 1. Checkout form submits to /api/orders
 * 2. If fetch fails (network error), catch block calls queueOfflineOrder()
 * 3. Order payload stored in "offline-orders-v1" cache
 * 4. Background Sync registered with "place-order" tag
 * 5. SW's syncOfflineOrders() processes the queue when back online
 * 6. User sees immediate "Order queued" confirmation (no waiting)
 *
 * The SW already has the sync handler (sw.js: sync event "place-order").
 * This file provides the client-side queuing utility.
 */

const OFFLINE_ORDERS_CACHE = "offline-orders-v1";

export interface OfflineOrderPayload {
  /** The full checkout form data that would be sent to /api/orders */
  [key: string]: unknown;
}

/**
 * Queue an order for background submission.
 * Called when the /api/orders fetch fails due to network error.
 *
 * @returns true if successfully queued, false if caching unavailable
 */
export async function queueOfflineOrder(payload: OfflineOrderPayload): Promise<boolean> {
  try {
    // Store in the offline-orders cache (SW reads from here)
    const cache = await caches.open(OFFLINE_ORDERS_CACHE);
    const orderUrl = `${location.origin}/api/orders`;
    const uniqueKey = `${orderUrl}?offline-id=${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await cache.put(
      new Request(uniqueKey),
      new Response(JSON.stringify(payload), {
        headers: { "Content-Type": "application/json" }
      })
    );

    // Register Background Sync (SW will process queue when online)
    await registerOrderSync();

    return true;
  } catch (err) {
    console.error("Failed to queue offline order:", err);
    return false;
  }
}

/**
 * Register the "place-order" Background Sync event.
 * The SW handles this tag in its sync event listener.
 */
async function registerOrderSync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if ("sync" in registration) {
      await (registration as any).sync.register("place-order");
    }
  } catch {
    // Background Sync not supported (Safari, Firefox)
    // Fallback: the SW will process on next page load via periodic check
    // Or the user can manually retry when back online
  }
}

/**
 * Check if there are pending offline orders waiting to be submitted.
 */
export async function hasPendingOfflineOrders(): Promise<boolean> {
  try {
    const cache = await caches.open(OFFLINE_ORDERS_CACHE);
    const keys = await cache.keys();
    return keys.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get count of pending offline orders.
 */
export async function getPendingOrderCount(): Promise<number> {
  try {
    const cache = await caches.open(OFFLINE_ORDERS_CACHE);
    const keys = await cache.keys();
    return keys.length;
  } catch {
    return 0;
  }
}

/**
 * Clear all pending offline orders (e.g., after manual retry succeeds).
 */
export async function clearPendingOrders(): Promise<void> {
  try {
    await caches.delete(OFFLINE_ORDERS_CACHE);
  } catch {}
}
