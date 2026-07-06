const CACHE = "msm-supermarket-v8";
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
    } catch {}
  }
}

const API_CACHE = "msm-api-cache-v1";

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.headers.get("range")) return;

  if (url.pathname.startsWith("/api/")) {
    if (url.pathname === "/api/products" || url.pathname.startsWith("/api/products?") || url.pathname.startsWith("/api/categories") || url.pathname === "/api/settings/public") {
      event.respondWith(
        caches.open(API_CACHE).then((cache) =>
          fetch(event.request)
            .then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => cache.match(event.request).then((cached) => cached || new Response(JSON.stringify({ error: "Offline" }), { status: 503, headers: { "Content-Type": "application/json" } })))
        )
      );
      return;
    }
    return;
  }

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
      if (cached) {
        fetchPromise.catch(() => {});
        return cached;
      }
      return fetchPromise;
    })
  );
});

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
    actions: [
      { action: "accept", title: isDelivery ? "Accept" : "Accept Order" },
      { action: "view", title: isDelivery ? "View Delivery" : "View Order" }
    ],
  };

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
});

async function pollForDeliveries() {
  try {
    const cache = await caches.open(API_CACHE);
    const response = await fetch("/api/delivery/poll", { credentials: "include" });
    if (response.ok) {
      cache.put("/api/delivery/poll", response.clone());
      const data = await response.json();
      if (data.orders?.length > 0) {
        const title = "New delivery assignment!";
        self.registration.showNotification(title, {
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
