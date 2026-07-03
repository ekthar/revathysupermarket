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

// Pre-cache notification sound for offline playback
const NOTIFICATION_SOUND_URL = "/sounds/delivery-alert.mp3";
let soundCached = false;

async function cacheNotificationSound() {
  if (soundCached) return;
  try {
    const cache = await caches.open("msm-fcm-cache");
    await cache.add(NOTIFICATION_SOUND_URL);
    soundCached = true;
  } catch { /* ignore */ }
}

self.addEventListener("install", async () => {
  self.skipWaiting();
  await cacheNotificationSound();
});

self.addEventListener("activate", async () => {
  await cacheNotificationSound();
  self.clients.claim();
});

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage(async (payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};

  const title = notification.title || data.title || "New Delivery";
  const body = notification.body || data.body || "Order assigned to you";

  // Determine notification type
  const isDelivery = data.type === "delivery_assignment";
  const isNewOrder = data.type === "new_order_alert";

  const options = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
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
    actions: [
      { action: "view", title: isDelivery ? "View Delivery" : "View Order" },
      { action: "accept", title: isDelivery ? "Accept" : "Accept Order" },
      { action: "dismiss", title: "Dismiss" }
    ],
  };

  // Android-specific: set notification channel
  if ("setNotificationChannel" in Notification.prototype) {
    options.channelId = isDelivery ? "deliveries" : "orders";
  }

  // Broadcast to all open tabs for instant UI update
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  clients.forEach((client) => {
    client.postMessage({
      type: "HEAVY_ALARM",
      payload: { title, ...data }
    });
  });

  // Show notification
  await self.registration.showNotification(title, options);
});

// Handle notification click / action
self.addEventListener("notificationclick", async (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const url = data.url || "/";
  const targetUrl = typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/";

  // Handle "accept" action - acknowledge via API
  if (action === "accept" && data.orderId) {
    try {
      await fetch(`/api/delivery/poll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId })
      });
    } catch { /* ignore */ }
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.includes(targetUrl)) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
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