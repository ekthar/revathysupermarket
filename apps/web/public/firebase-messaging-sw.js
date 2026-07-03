// Firebase Messaging Service Worker
// This handles background push notifications from Firebase Cloud Messaging

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase config is injected at runtime via the main SW or fetched from the app
firebase.initializeApp({
  apiKey: self.__FIREBASE_CONFIG__?.apiKey || "",
  authDomain: self.__FIREBASE_CONFIG__?.authDomain || "",
  projectId: self.__FIREBASE_CONFIG__?.projectId || "",
  storageBucket: self.__FIREBASE_CONFIG__?.storageBucket || "",
  messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId || "",
  appId: self.__FIREBASE_CONFIG__?.appId || "",
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};

  const title = notification.title || data.title || "New notification";
  const options = {
    body: notification.body || data.body || "You have a new update",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.orderId ? `order-${data.orderId}` : "fcm-notification",
    data: {
      url: data.deepLink || data.url || "/dashboard",
      orderId: data.orderId,
      type: data.type,
    },
    // Keep heavy notifications on screen indefinitely for Windows Doze
    requireInteraction: data.type === "delivery_assignment" || data.type === "new_order_alert",
    renotify: true,
    vibrate: [300, 100, 300, 100, 300],
  };

  // Broadcast to all open tabs so they can ring the heavy alarm
  self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({
        type: "HEAVY_ALARM",
        payload: {
          title,
          ...data
        }
      });
    });
  });

  return self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  const targetUrl = typeof url === "string" && url.startsWith("/") && !url.startsWith("//")
    ? url
    : "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.includes(targetUrl)) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
