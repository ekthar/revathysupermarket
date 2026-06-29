/**
 * MSM Supermarket Service Worker
 * 
 * Workbox-style runtime caching strategies:
 * - CacheFirst: images (30 days TTL)
 * - StaleWhileRevalidate: /api/products*, /api/categories*
 * - NetworkFirst: /api/cart, /api/orders (3s timeout)
 * - Network-only: all other API routes
 * - CacheFirst: static assets (_next/static, icons, manifest)
 * - NavigationRoute: offline fallback
 * 
 * Version constant guards skip-waiting + clients-claim.
 */

const SW_VERSION = "msm-sw-v7";
const STATIC_CACHE = `${SW_VERSION}-static`;
const IMAGES_CACHE = `${SW_VERSION}-images`;
const API_CACHE = `${SW_VERSION}-api`;

const STATIC_ASSETS = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-maskable-512.png",
];

// Cache TTLs
const IMAGE_MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days
const API_PRODUCTS_MAX_AGE_S = 5 * 60; // 5 minutes
const NETWORK_TIMEOUT_MS = 3000; // 3 seconds for NetworkFirst

// Max entries per cache to prevent unbounded growth
const IMAGE_MAX_ENTRIES = 200;
const API_MAX_ENTRIES = 50;

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== IMAGES_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Message handling ────────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  // Notify clients about network status changes
  if (event.data?.type === "GET_VERSION") {
    event.source?.postMessage({ type: "SW_VERSION", version: SW_VERSION });
  }
});

// ─── Fetch — Runtime caching strategies ──────────────────────────────────────

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Safari fix: don't handle range requests
  if (event.request.headers.get("range")) return;

  // Safari fix: skip non-http protocols
  if (url.protocol !== "https:" && url.protocol !== "http:") return;

  // ─── Navigation requests → Network with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(navigationHandler(event.request));
    return;
  }

  // ─── API routes
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(apiHandler(url, event.request));
    return;
  }

  // ─── Image requests → CacheFirst (30 days)
  if (isImageRequest(url, event.request)) {
    event.respondWith(cacheFirst(event.request, IMAGES_CACHE, IMAGE_MAX_AGE_S));
    return;
  }

  // ─── Static assets → CacheFirst
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }
});

// ─── Strategy: NavigationHandler ─────────────────────────────────────────────

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaqueredirect") return response;
    return response;
  } catch {
    const cached = await caches.match("/offline");
    return cached || new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/html" },
    });
  }
}

// ─── Strategy: API Handler (route-based) ─────────────────────────────────────

async function apiHandler(url, request) {
  const pathname = url.pathname;

  // StaleWhileRevalidate: /api/products*, /api/categories*
  if (pathname.startsWith("/api/products") || pathname.startsWith("/api/categories")) {
    return staleWhileRevalidate(request, API_CACHE);
  }

  // NetworkFirst with 3s timeout: /api/cart*, /api/orders*
  if (pathname.startsWith("/api/cart") || pathname.startsWith("/api/orders")) {
    return networkFirst(request, API_CACHE, NETWORK_TIMEOUT_MS);
  }

  // All other API routes: network-only (no caching)
  try {
    return await fetch(request);
  } catch {
    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ─── Strategy: CacheFirst ────────────────────────────────────────────────────

async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cached = await caches.match(request);

  if (cached) {
    // Check TTL if maxAge is specified
    if (maxAgeSeconds) {
      const dateHeader = cached.headers.get("sw-cache-time");
      if (dateHeader) {
        const cachedTime = Number(dateHeader);
        if (Date.now() - cachedTime > maxAgeSeconds * 1000) {
          // Expired — fetch fresh in background, return stale
          fetchAndCache(request, cacheName).catch(() => {});
          return cached;
        }
      }
    }
    return cached;
  }

  return fetchAndCache(request, cacheName);
}

// ─── Strategy: StaleWhileRevalidate ──────────────────────────────────────────

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  // Always revalidate in background
  const fetchPromise = fetchAndCache(request, cacheName).catch(() => cached);

  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

// ─── Strategy: NetworkFirst (with timeout) ───────────────────────────────────

async function networkFirst(request, cacheName, timeoutMs) {
  try {
    const response = await promiseWithTimeout(fetch(request), timeoutMs);
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName);
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set("sw-cache-time", String(Date.now()));
      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });
      cache.put(request, cachedResponse).catch(() => {});
    }
    return response;
  } catch {
    // Timeout or network error — fall back to cache
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchAndCache(request, cacheName) {
  const response = await fetch(request);
  // Safari fix: only cache basic/cors responses
  if (response.ok && (response.type === "basic" || response.type === "cors")) {
    const cache = await caches.open(cacheName);
    const headers = new Headers(response.headers);
    headers.set("sw-cache-time", String(Date.now()));
    const cachedResponse = new Response(await response.clone().blob(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    cache.put(request, cachedResponse).catch(() => {});
  }
  return response;
}

function promiseWithTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout")), timeoutMs);
    promise.then((result) => {
      clearTimeout(timer);
      resolve(result);
    }).catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function isImageRequest(url, request) {
  const acceptHeader = request.headers.get("accept") || "";
  if (acceptHeader.includes("image/")) return true;
  const ext = url.pathname.split(".").pop()?.toLowerCase();
  return ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico"].includes(ext || "");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/branding/")
  );
}

// ─── Push notifications (preserved from existing) ────────────────────────────

self.addEventListener("push", (event) => {
  let payload = {
    title: "New order!",
    body: "A new order is waiting in the admin panel.",
    url: "/admin/orders",
    requireInteraction: false,
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.orderId ? `order-${payload.orderId}` : "new-order",
    data: { url: payload.url },
    requireInteraction: payload.requireInteraction !== false,
    renotify: true,
    vibrate: [300, 100, 300, 100, 300],
    actions: [
      { action: "view", title: "View Order" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = event.notification.data?.url;
  const targetUrl =
    typeof requestedUrl === "string" &&
    requestedUrl.startsWith("/") &&
    !requestedUrl.startsWith("//")
      ? requestedUrl
      : "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client && client.url.includes(targetUrl))
            return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
        return undefined;
      })
  );
});
