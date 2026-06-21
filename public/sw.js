const CACHE = "msm-supermarket-v4";
const STATIC_ASSETS = ["/offline", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png", "/icons/icon-maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Safari fix: don't handle range requests (audio/video) - Safari uses these heavily
  if (event.request.headers.get("range")) return;

  // Safari fix: don't intercept requests for chrome-extension or blob URLs
  if (url.protocol !== "https:" && url.protocol !== "http:") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Safari fix: only cache successful navigation responses
          if (response.ok || response.type === "opaqueredirect") return response;
          return response;
        })
        .catch(() => caches.match("/offline").then((cached) => cached || new Response("Offline", { status: 503, headers: { "Content-Type": "text/html" } })))
    );
    return;
  }

  const isPublicAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest";
  if (!isPublicAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Safari fix: only cache basic/cors responses, not opaque
        if (response.ok && (response.type === "basic" || response.type === "cors")) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Return a fallback for failed icon/asset requests
        return new Response("", { status: 404 });
      });
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "New order!",
    body: "A new order is waiting in the admin panel.",
    url: "/admin/orders"
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.orderId ? `order-${payload.orderId}` : "new-order",
      data: { url: payload.url }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = event.notification.data?.url;
  const targetUrl = typeof requestedUrl === "string" && requestedUrl.startsWith("/") && !requestedUrl.startsWith("//")
    ? requestedUrl
    : "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.includes(targetUrl)) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
