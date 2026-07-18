/**
 * Native Push — Capacitor PushNotifications registration + FCM token management.
 *
 * Handles:
 * - Registering for push notifications via Capacitor plugin
 * - Saving FCM token to the backend
 * - Listening for incoming push messages (foreground)
 * - Handling notification tap (deep link routing)
 *
 * Falls back to web push (via push-notification-manager) when not native.
 */

import { isNative, platform } from "@/lib/native-bridge";

const TOKEN_KEY = "native-push-token";

export type PushPayload = {
  type?: string;
  orderId?: string;
  title?: string;
  body?: string;
  url?: string;
  alarmSound?: string;
  channelId?: string;
  fullScreen?: string;
  priority?: string;
  [key: string]: string | undefined;
};

type PushListener = (payload: PushPayload) => void;

const listeners: Set<PushListener> = new Set();

/** Register for push notifications and get FCM token */
export async function registerNativePush(): Promise<string | null> {
  if (!isNative) return null;

  try {
    // @ts-ignore
    const { PushNotifications } = await import(/* webpackIgnore: true */ "@capacitor/push-notifications");

    // Register with APNs/FCM
    await PushNotifications.register();

    // Listen for registration success
    return new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 10000);

      PushNotifications.addListener("registration", async (token: { value: string }) => {
        clearTimeout(timeout);
        const fcmToken = token.value;

        // Save to backend
        await saveTokenToBackend(fcmToken);

        // Cache locally
        try { localStorage.setItem(TOKEN_KEY, fcmToken); } catch {}

        resolve(fcmToken);
      });

      PushNotifications.addListener("registrationError", () => {
        clearTimeout(timeout);
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}

/** Set up foreground push message listener */
export async function setupPushListeners(): Promise<() => void> {
  if (!isNative) return () => {};

  try {
    // @ts-ignore
    const { PushNotifications } = await import(/* webpackIgnore: true */ "@capacitor/push-notifications");

    // Foreground push received
    const foregroundListener = await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: { data?: PushPayload; title?: string; body?: string }) => {
        const payload: PushPayload = {
          ...notification.data,
          title: notification.title || notification.data?.title,
          body: notification.body || notification.data?.body,
        };
        // Notify all registered listeners
        listeners.forEach((cb) => cb(payload));
      }
    );

    // Notification tapped (app opened from notification)
    const tapListener = await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: { notification: { data?: PushPayload } }) => {
        const payload = action.notification.data;
        if (payload?.url) {
          // Navigate to the deep link URL
          window.location.href = payload.url;
        }
      }
    );

    return () => {
      foregroundListener?.remove?.();
      tapListener?.remove?.();
    };
  } catch {
    return () => {};
  }
}

/** Register a listener for incoming push messages */
export function onPushReceived(callback: PushListener): () => void {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

/** Save FCM token to the backend */
async function saveTokenToBackend(token: string): Promise<void> {
  try {
    await fetch("/api/device-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        platform: platform,
        deviceType: "native",
      }),
    });
  } catch {
    // Non-critical — will retry on next app open
  }
}

/** Get the cached push token */
export function getCachedPushToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Unregister push token (on logout) */
export async function unregisterNativePush(): Promise<void> {
  if (!isNative) return;

  const token = getCachedPushToken();
  if (!token) return;

  try {
    await fetch("/api/device-tokens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}
