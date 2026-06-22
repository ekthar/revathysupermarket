"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/toast-provider";

function publicKeyToUint8Array(publicKey: string) {
  const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
  const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

const DISMISSED_KEY = "push-prompt-dismissed";
const SUBSCRIBED_KEY = "push-subscribed";

export function PushNotificationManager() {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const [showPrompt, setShowPrompt] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;

  const silentResubscribe = useCallback(async () => {
    if (!publicKey) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKeyToUint8Array(publicKey)
        });
      }
      const response = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON())
      });
      if (response.ok) {
        localStorage.setItem(SUBSCRIBED_KEY, "true");
      }
    } catch {}
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey) return;
    if (!session?.user) return;
    if (!("serviceWorker" in navigator && "PushManager" in window && "Notification" in window)) return;

    // If already subscribed, silently re-register (handles DB reset)
    if (localStorage.getItem(SUBSCRIBED_KEY) === "true" || Notification.permission === "granted") {
      silentResubscribe();
      return;
    }

    if (Notification.permission === "denied") return;

    // Check if dismissed recently (12 hours)
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 12 * 60 * 60 * 1000) return;

    const timer = setTimeout(() => setShowPrompt(true), 2000);
    return () => clearTimeout(timer);
  }, [publicKey, session?.user, silentResubscribe]);

  async function enableNotifications() {
    if (!publicKey) return;
    setSubscribing(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Please allow notifications", "error");
        setSubscribing(false);
        dismiss();
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKeyToUint8Array(publicKey)
        });
      }

      const response = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON())
      });

      if (response.ok) {
        localStorage.setItem(SUBSCRIBED_KEY, "true");
        showToast("Notifications enabled!", "success");
      } else {
        showToast("Failed. Make sure you're logged in.", "error");
      }
    } catch (err) {
      console.error("Push error:", err);
      showToast("Could not enable notifications", "error");
    }

    setSubscribing(false);
    setShowPrompt(false);
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShowPrompt(false);
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          data-push-prompt
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          data-hide-on-keyboard="true"
          className="fixed left-[max(1rem,var(--safe-left))] right-[max(1rem,var(--safe-right))] bottom-[calc(var(--mobile-nav-height)+var(--safe-bottom)+0.5rem)] z-[60] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 md:bottom-6 md:left-auto md:right-6 md:w-[360px]"
        >
          <button type="button" onClick={dismiss} aria-label="Dismiss notification prompt" className="absolute top-3 right-3 h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center press">
            <X className="h-3 w-3 text-slate-500" />
          </button>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-slate-900 dark:text-white">Get Order Updates</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Never miss a delivery! Get instant status notifications.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={enableNotifications} disabled={subscribing} className="flex-1 h-10 rounded-xl bg-black text-[13px] font-bold text-white press disabled:opacity-50">
              {subscribing ? "Enabling..." : "Enable Notifications"}
            </button>
            <button type="button" onClick={dismiss} className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 press">
              Later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
