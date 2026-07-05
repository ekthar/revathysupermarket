// Firebase Messaging Service Worker
// Handles background push notifications with high-priority delivery, sound, and notification channels

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: self.__FIREBASE_CONFIG__?.apiKey || "",
  authDomain: self.__FIREBASE_CONFIG__?.authDomain || "",
  projectId: self.__FIREBASE_CONFIG__?.projectId || "",
  storageBucket: self.__FIREBASE_CONFIG__?.storageBucket || "",
  messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId || "",
  appId: self.__FIREBASE_CONFIG__?.appId || "",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage(async (payload) => {
  const data = payload.data || {};

  // Broadcast to all open tabs for instant UI update, regardless of how the
  // notification itself gets displayed below.
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  clients.forEach((client) => {
    client.postMessage({
      type: "HEAVY_ALARM",
      payload: { title: payload.notification?.title || data.title, ...data }
    });
  });

  // If the push carries a top-level "notification" payload, the FCM SDK already displays
  // it automatically - calling showNotification() again here would stack a second,
  // duplicate notification (and a second vibration burst) for the same push. Only
  // data-only messages need to be shown manually.
  if (payload.notification) return;

  const title = data.title || "New Delivery";
  const body = data.body || "Order assigned to you";
  const isDelivery = data.type === "delivery_assignment";
  const isNewOrder = data.type === "new_order_alert";

  const options = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.orderId ? `order-${data.orderId}` : `fcm-${Date.now()}`,
    data: {
      url: data.deepLink || data.url || (isDelivery ? "/delivery" : "/admin/orders"),
      orderId: data.orderId,
      type: data.type,
    },
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

  await self.registration.showNotification(title, options);
});

// Handle notification click / action
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const url = data.url || "/";
  const targetUrl = typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/";

  // Admin new-order alerts and delivery assignments acknowledge through different APIs.
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
          if ("focus" in client && client.url.includes(targetUrl)) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
        return undefined;
      })
    ])
  );
});

// Handle notification close (dismiss)
self.addEventListener("notificationclose", (event) => {
  const data = event.notification.data || {};
  if (data.orderId && data.type === "delivery_assignment") {
    console.log("Delivery notification dismissed:", data.orderId);
  }
});

// Periodic background sync for closed-app polling
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "delivery-poll") {
    event.waitUntil(pollForDeliveries());
  }
});

async function pollForDeliveries() {
  try {
    console.log("Periodic sync triggered for delivery poll");
  } catch { /* ignore */ }
}