"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";

function publicKeyToUint8Array(publicKey: string) {
  const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
  const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function PushNotificationManager() {
  const { showToast } = useToast();
  const [supported, setSupported] = useState(false);
  const [registered, setRegistered] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;

  useEffect(() => {
    setSupported(Boolean(publicKey && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window));
  }, [publicKey]);

  async function enableNotifications() {
    if (!publicKey) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      showToast("Notifications were not enabled", "error");
      return;
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKeyToUint8Array(publicKey)
    });
    const response = await fetch("/api/push-subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON())
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      showToast(data.error ?? "Notification setup failed", "error");
      return;
    }
    setRegistered(true);
    showToast("Order notifications enabled", "success");
  }

  if (!supported || registered || Notification.permission === "granted") return null;

  return (
    <button
      type="button"
      onClick={enableNotifications}
      className="fixed bottom-24 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-4 text-xs font-black text-white shadow-premium"
    >
      <Bell className="h-4 w-4" />
      Enable order alerts
    </button>
  );
}
