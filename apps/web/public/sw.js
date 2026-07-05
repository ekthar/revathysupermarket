// AUTO-INCREMENT this version string (e.g., v8, v9) in CI or before each deploy to force re-cache
const CACHE = "msm-supermarket-v7";
// NOTE: only list assets that actually exist in /public. `cache.addAll` is atomic - a
// single 404 (e.g. a badge icon or sound file that was never added) rejects the whole
// install, so the service worker never activates and none of its logic ever runs.
const STATIC_ASSETS = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png"
];

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

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "REGISTER_PERIODIC_SYNC") {
    event.waitUntil(registerPeriodicSync());
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => registerPeriodicSync())
  );
});

async function registerPeriodicSync() {
  if ("periodicSync" in self.registration) {
    try {
      await self.registration.periodicSync.register("delivery-poll", { minInterval: 30000 });
      console.info("Periodic sync registered for delivery-poll");
    } catch (e) {
      console.log("Periodic sync registration failed:", e);
    }
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (event.request.headers.get("range")) return;
  if (url.protocol !== "https:" && url.protocol !== "http:") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok || response.type === "opaqueredirect") return response;
          return response;
        })
        .catch(() => caches.match("/offline").then((cached) => cached || new Response("Offline", { status: 503, headers: { "Content-Type": "text/html" } })))
    );
    return;
  }

  const isPublicAsset = url.pathname.startsWith("/_next/static/") || 
                        url.pathname.startsWith("/icons/") || 
                        url.pathname === "/manifest.webmanifest";
  if (!isPublicAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok && (response.type === "basic" || response.type === "cors")) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => new Response("", { status: 404 }));
      // Stale-while-revalidate: return cached immediately, fetch latest in background
      if (cached) {
        fetchPromise.catch(() => {});
        return cached;
      }
      return fetchPromise;
    })
  );
});

// Push notification handler (Web Push API fallback / VAPID)
self.addEventListener("push", (event) => {
  let payload = {
    title: "New order!",
    body: "A new order is waiting.",
    url: "/",
    requireInteraction: false
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const isDelivery = payload.type === "delivery_assignment";
  const isNewOrder = payload.type === "new_order_alert";

  const options = {
    body: payload.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.orderId ? `order-${payload.orderId}` : "new-order",
    data: { url: payload.url, orderId: payload.orderId, type: payload.type },
    requireInteraction: isDelivery || isNewOrder,
    renotify: true,
    vibrate: [300, 100, 300, 100, 300, 200, 500],
    timestamp: Date.now(),
    // Most platforms (Android Chrome included) only render ~2 actions and silently drop
    // the rest, so keep this to the two that matter most.
    actions: [
      { action: "accept", title: isDelivery ? "Accept" : "Accept Order" },
      { action: "view", title: isDelivery ? "View Delivery" : "View Order" }
    ],
  };

  // Broadcast to tabs
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title, options),
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "HEAVY_ALARM", payload: { title: payload.title, ...payload } });
        });
      })
    ])
  );
});

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

  // Both the ack request and the focus/open must be inside waitUntil - Android can
  // terminate the service worker as soon as the browser considers the event "done",
  // which otherwise aborts the ack fetch before it reaches the server.
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

// Periodic background sync handler
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "delivery-poll") {
    event.waitUntil(pollForDeliveries());
  }
});

async function pollForDeliveries() {
  try {
    // Note: In SW context, we don't have auth cookies.
    // This is a placeholder. For true background polling when app is closed,
    // we rely on FCM push (firebase-messaging-sw.js) which runs in its own SW scope.
    // Or use Capacitor native plugin for true native background execution.
    
    // However, we can attempt to fetch with credentials if the SW is in the same origin
    // and the user has an active session (unlikely when fully closed).
    console.log("Periodic sync: delivery-poll triggered");
  } catch { /* ignore */ }
}