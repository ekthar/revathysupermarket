const CACHE = "msm-supermarket-v9";
const API_CACHE = "msm-api-cache-v2";
const IMG_CACHE = "msm-images-v1";

const STATIC_ASSETS = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png"
];

// Max cached API responses (LRU eviction)
const MAX_API_ENTRIES = 80;
// Max cached images
const MAX_IMG_ENTRIES = 200;

// ─── INSTALL ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        STATIC_ASSETS.map((asset) => cache.add(asset).catch((err) => console.warn("SW: failed to cache", asset, err)))
      )
    )
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE && key !== API_CACHE && key !== IMG_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
      .then(() => registerPeriodicSync())
  );
});

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "REGISTER_PERIODIC_SYNC") {
    event.waitUntil(registerPeriodicSync());
  }
});

async function registerPeriodicSync() {
  if ("periodicSync" in self.registration) {
    try {
      await self.registration.periodicSync.register("delivery-poll", { minInterval: 30000 });
    } catch {}
  }
}

// ─── FETCH ────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin && !isImageHost(url)) return;
  if (event.request.headers.get("range")) return;

  // ── Product images (external hosts: unsplash, etc.)
  if (isImageHost(url) || isProductImage(url)) {
    event.respondWith(cacheFirstWithLimit(event.request, IMG_CACHE, MAX_IMG_ENTRIES));
    return;
  }

  // ── API routes: network-first with offline fallback
  if (url.pathname.startsWith("/api/")) {
    if (isCacheableAPI(url.pathname)) {
      event.respondWith(networkFirstWithCache(event.request, API_CACHE, MAX_API_ENTRIES));
      return;
    }
    return;
  }

  // ── Navigation: network-first, offline fallback page
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful product detail page navigations for offline browsing
          if (response.ok && url.pathname.startsWith("/products/")) {
            caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          // Try cached version of this specific page first
          caches.match(event.request).then((cached) =>
            cached || caches.match("/offline").then((offline) =>
              offline || new Response("Offline", { status: 503, headers: { "Content-Type": "text/html" } })
            )
          )
        )
    );
    return;
  }

  // ── Static assets: stale-while-revalidate
  const isPublicAsset = url.pathname.startsWith("/_next/static/") ||
                        url.pathname.startsWith("/icons/") ||
                        url.pathname === "/manifest.webmanifest";
  if (!isPublicAsset) return;

  event.respondWith(staleWhileRevalidate(event.request, CACHE));
});

// ─── Caching Strategies ───────────────────────────────────────────────────────

/** Network-first: try network, cache response, fallback to cache on failure */
async function networkFirstWithCache(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and cache
      cache.put(request, response.clone());
      // LRU eviction
      trimCache(cacheName, maxEntries);
    }
    return response;
  } catch {
    // Offline: serve from cache
    const cached = await cache.match(request);
    if (cached) {
      // Add offline indicator header so client knows this is cached
      const headers = new Headers(cached.headers);
      headers.set("X-SW-Cache", "offline");
      return new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
    }
    return new Response(JSON.stringify({ error: "Offline", cached: false }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/** Cache-first with network fallback (for images) */
async function cacheFirstWithLimit(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(cacheName, maxEntries);
    }
    return response;
  } catch {
    // Return transparent 1x1 pixel as fallback for failed images
    return new Response(
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E",
      { headers: { "Content-Type": "image/svg+xml" } }
    );
  }
}

/** Stale-while-revalidate: serve cache immediately, update in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok && (response.type === "basic" || response.type === "cors")) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  if (cached) {
    // Serve cached immediately, update in background
    fetchPromise.catch(() => {});
    return cached;
  }

  // No cache: wait for network
  const response = await fetchPromise;
  return response || new Response("", { status: 404 });
}

/** Trim cache to maxEntries (LRU: delete oldest entries) */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    // Delete oldest entries (first in = first out)
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Check if URL is a cacheable API endpoint */
function isCacheableAPI(pathname) {
  return pathname === "/api/products" ||
    pathname.startsWith("/api/products?") ||
    pathname.startsWith("/api/products/") ||
    pathname.startsWith("/api/categories") ||
    pathname === "/api/settings/public" ||
    pathname === "/api/store-settings";
}

/** Check if URL is an external image host we should cache */
function isImageHost(url) {
  return url.hostname === "images.unsplash.com" ||
    url.hostname.includes("cloudinary.com") ||
    url.hostname.includes("supabase.co");
}

/** Check if URL is a product image on our own domain */
function isProductImage(url) {
  return url.pathname.startsWith("/uploads/") ||
    url.pathname.startsWith("/images/products/");
}

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let payload = {
    title: "Revathy Supermarket",
    body: "You have a new notification.",
    url: "/",
    type: "promo",
    requireInteraction: false
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  // Build rich notification options from payload
  const options = {
    body: payload.body,
    icon: payload.badge || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    // Rich image (product photo, promo banner) — shows as large image
    image: payload.image || undefined,
    // Tag for grouping — same tag replaces previous notification
    tag: payload.tag || payload.orderId ? `order-${payload.orderId}` : `${payload.type}-${Date.now()}`,
    // Data passed to notificationclick handler
    data: {
      url: payload.url,
      orderId: payload.orderId,
      productId: payload.productId,
      type: payload.type,
      ...(payload.data || {}),
    },
    requireInteraction: payload.requireInteraction || false,
    renotify: true,
    silent: false,
    // Vibration pattern from payload or sensible default
    vibrate: payload.vibrate || [200, 100, 200],
    timestamp: Date.now(),
    // Action buttons — use payload's actions or generate from type
    actions: payload.actions || getDefaultActions(payload.type),
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title, options),
      // Forward to open tabs for in-app handling
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "PUSH_RECEIVED", payload });
        });
      })
    ])
  );
});

/** Get default action buttons based on notification type */
function getDefaultActions(type) {
  switch (type) {
    case "order_confirmed":
    case "order_ready":
      return [{ action: "track", title: "Track" }, { action: "view", title: "Details" }];
    case "order_delivered":
      return [{ action: "rate", title: "Rate" }, { action: "reorder", title: "Reorder" }];
    case "delivery_assignment":
    case "new_order_alert":
      return [{ action: "accept", title: "Accept" }, { action: "view", title: "View" }];
    case "price_drop":
    case "back_in_stock":
      return [{ action: "add-cart", title: "Add to Cart" }, { action: "view", title: "View" }];
    case "promo":
      return [{ action: "shop", title: "Shop Now" }];
    default:
      return [{ action: "view", title: "Open" }];
  }
}

// ─── NOTIFICATION CLICK ───────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const url = data.url || "/";
  const targetUrl = typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/";

  const acceptPromise =
    action === "accept" && data.orderId
      ? fetch(
          data.type === "new_order_alert" ? `/api/admin/orders/${data.orderId}/acknowledge` : "/api/delivery/poll",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: data.type === "new_order_alert" ? undefined : JSON.stringify({ orderId: data.orderId })
          }
        ).catch(() => {})
      : Promise.resolve();

  event.waitUntil(
    Promise.all([
      acceptPromise,
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client && client.url.includes(targetUrl)) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
        return undefined;
      })
    ])
  );
});

// ─── BACKGROUND SYNC ──────────────────────────────────────────────────────────

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "delivery-poll") {
    event.waitUntil(pollForDeliveries());
  }
  if (event.tag === "sync-orders") {
    event.waitUntil(syncOfflineOrders());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "place-order") {
    event.waitUntil(syncOfflineOrders());
  }
  if (event.tag === "update-delivery") {
    event.waitUntil(syncOfflineOrders());
  }
  if (event.tag === "cart-sync") {
    event.waitUntil(syncCartMutations());
  }
});

async function pollForDeliveries() {
  try {
    const cache = await caches.open(API_CACHE);
    const response = await fetch("/api/delivery/poll", { credentials: "include" });
    if (response.ok) {
      cache.put("/api/delivery/poll", response.clone());
      const data = await response.json();
      if (data.orders?.length > 0) {
        self.registration.showNotification("New delivery assignment!", {
          body: `You have ${data.orders.length} order(s) ready for delivery`,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          requireInteraction: true,
          vibrate: [300, 100, 300],
          data: { url: "/delivery", type: "delivery_assignment" }
        });
      }
    }
  } catch {}
}

async function syncOfflineOrders() {
  try {
    const cache = await caches.open("offline-orders-v1");
    const keys = await cache.keys();
    for (const request of keys) {
      const entry = await cache.match(request);
      if (!entry) continue;
      const data = await entry.json();
      try {
        const response = await fetch(request.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include"
        });
        if (response.ok) {
          await cache.delete(request);
        }
      } catch {}
    }
  } catch {}
}

async function syncCartMutations() {
  // Cart sync queue handles its own persistence and retry logic
  // This sync event just wakes the page to trigger the queue flush
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((client) => {
    client.postMessage({ type: "CART_SYNC_WAKE" });
  });
}
