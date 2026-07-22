"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { springs } from "@/lib/motion";

/**
 * NetworkStatus — shows a native-style banner when connectivity is lost/restored.
 *
 * Behavior:
 * - Shows "No Internet Connection" banner when offline
 * - Shows "Back Online" banner briefly when reconnected
 * - Auto-dismisses the "Back Online" banner after 2s
 * - Doesn't show anything during initial load (avoids flash)
 */
export function NetworkStatus() {
  const [status, setStatus] = useState<"online" | "offline" | "reconnected" | null>(null);

  useEffect(() => {
    // Don't flash on mount
    if (!navigator.onLine) {
      setStatus("offline");
    }

    const handleOffline = () => setStatus("offline");
    const handleOnline = () => {
      setStatus("reconnected");
      // Auto-hide "Back Online" after 2 seconds
      setTimeout(() => setStatus(null), 2000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {status === "offline" && (
        <motion.div
          key="offline"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={springs.enter}
          className="fixed top-0 left-0 right-0 z-[999] pt-safe"
        >
          <div className="mx-auto flex items-center justify-center gap-2 bg-red-600 px-4 py-2.5 text-white text-xs font-bold">
            <WifiOff className="h-3.5 w-3.5" />
            No Internet Connection
          </div>
        </motion.div>
      )}
      {status === "reconnected" && (
        <motion.div
          key="reconnected"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={springs.enter}
          className="fixed top-0 left-0 right-0 z-[999] pt-safe"
        >
          <div className="mx-auto flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2.5 text-white text-xs font-bold">
            <Wifi className="h-3.5 w-3.5" />
            Back Online
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
