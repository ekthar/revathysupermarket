"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Offline banner driven by navigator.onLine + service worker sync events.
 * Shows a non-intrusive top banner when connectivity is lost.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for service worker sync events
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "NETWORK_STATUS") {
          setIsOffline(!event.data.online);
        }
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          role="status"
          aria-live="polite"
          className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-state-warn px-4 py-2.5 text-caption font-bold text-white shadow-elevation-2"
          style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
        >
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span>You&apos;re offline. Some features may be limited.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
