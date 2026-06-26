"use client";

import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";

const FCM_TOKEN_KEY = "fcm-device-token";
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Register the Firebase messaging service worker and get the FCM token.
 * Saves the token to the server for push notification targeting.
 */
export async function registerFcmToken(): Promise<string | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // Check permission
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return null;
    }
    if (Notification.permission !== "granted") return null;

    // Register Firebase messaging service worker
    let registration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (!registration) {
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/",
      });
    }

    // Pass Firebase config to the service worker
    if (registration.active) {
      registration.active.postMessage({
        type: "FIREBASE_CONFIG",
        config: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        },
      });
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    // Check if token changed
    const previousToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (previousToken === token) return token;

    // Save token to server
    const response = await fetch("/api/device-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: "web" }),
    });

    if (response.ok) {
      localStorage.setItem(FCM_TOKEN_KEY, token);
    }

    return token;
  } catch (error) {
    console.error("[FCM Client] Failed to register token:", error);
    return null;
  }
}

/**
 * Listen for foreground FCM messages and show a toast/notification.
 */
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;
  return onMessage(messaging, callback);
}

/**
 * Remove FCM token from server (e.g., on logout).
 */
export async function unregisterFcmToken(): Promise<void> {
  const token = localStorage.getItem(FCM_TOKEN_KEY);
  if (!token) return;

  await fetch("/api/device-tokens", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  }).catch(() => null);

  localStorage.removeItem(FCM_TOKEN_KEY);
}
