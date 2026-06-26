"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { registerFcmToken, onForegroundMessage } from "@/lib/fcm-client";
import { useToast } from "@/components/toast-provider";

/**
 * FCM Registration Component
 * 
 * Auto-registers FCM device token when:
 * 1. User is authenticated
 * 2. Firebase is configured (NEXT_PUBLIC_FIREBASE_API_KEY exists)
 * 3. Browser supports notifications
 * 
 * Also listens for foreground messages and shows a toast.
 * Place this in the root layout.
 */
export function FcmRegistration() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const firebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

  useEffect(() => {
    if (!firebaseConfigured) return;
    if (!session?.user?.id) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator && "Notification" in window)) return;

    // Only auto-register if permission is already granted
    // (Don't prompt - let PushNotificationManager handle the prompt)
    if (Notification.permission === "granted") {
      registerFcmToken().catch(() => null);
    }
  }, [session?.user?.id, firebaseConfigured]);

  // Listen for foreground messages
  useEffect(() => {
    if (!firebaseConfigured) return;
    if (!session?.user?.id) return;

    let unsubscribe: (() => void) | null = null;

    onForegroundMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || "Notification";
      const body = payload.notification?.body || payload.data?.body || "";
      showToast(`${title}${body ? `: ${body}` : ""}`, "success");
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session?.user?.id, firebaseConfigured, showToast]);

  return null;
}
