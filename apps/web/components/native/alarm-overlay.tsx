"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MapPin, Package, X } from "lucide-react";
import { springs } from "@/lib/motion";
import {
  onAlarmTriggered,
  onAlarmDismissed,
  dismissAlarm,
  type AlarmConfig,
} from "@/lib/native-alarm";
import { haptic } from "@/lib/haptics";

/**
 * AlarmOverlay — full-screen alarm UI for incoming orders/deliveries.
 *
 * Shows when native-alarm triggers. Covers entire screen with
 * pulsing visual + action buttons. Slide-to-dismiss or tap Accept.
 */
export function AlarmOverlay() {
  const [alarm, setAlarm] = useState<AlarmConfig | null>(null);

  useEffect(() => {
    const unsubTrigger = onAlarmTriggered((config) => setAlarm(config));
    const unsubDismiss = onAlarmDismissed(() => setAlarm(null));
    return () => { unsubTrigger(); unsubDismiss(); };
  }, []);

  const handleDismiss = useCallback(() => {
    haptic("medium");
    dismissAlarm();
  }, []);

  const handleAccept = useCallback(() => {
    haptic("heavy");
    const url = alarm?.url;
    dismissAlarm();
    if (url) window.location.href = url;
  }, [alarm]);

  return (
    <AnimatePresence>
      {alarm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-neutral-950"
        >
          {/* Pulsing ring */}
          <div className="relative mb-10">
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-emerald-500" style={{ margin: "-24px" }} />
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              className="absolute inset-0 rounded-full bg-emerald-400" style={{ margin: "-12px" }} />
            <div className="relative h-24 w-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl">
              {alarm.type === "delivery_assigned" ? (
                <MapPin className="h-12 w-12 text-white" strokeWidth={2} />
              ) : (
                <Package className="h-12 w-12 text-white" strokeWidth={2} />
              )}
            </div>
          </div>

          {/* Info */}
          <h1 className="text-2xl font-black text-white text-center px-6">
            {alarm.type === "delivery_assigned" ? "New Delivery!" : "New Order!"}
          </h1>
          <p className="mt-2 text-lg font-semibold text-white/80 text-center px-8">
            {alarm.title}
          </p>
          <p className="mt-1 text-sm text-white/50 text-center px-8 max-w-sm">
            {alarm.body}
          </p>

          {alarm.orderId && (
            <p className="mt-3 text-xs font-mono text-white/40">
              Order #{alarm.orderId.slice(-6).toUpperCase()}
            </p>
          )}

          {/* Action buttons */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-12 space-y-3">
            <button type="button" onClick={handleAccept}
              className="w-full h-16 rounded-2xl bg-emerald-500 text-white font-black text-lg flex items-center justify-center gap-3 press shadow-xl">
              <Phone className="h-6 w-6" />
              {alarm.type === "delivery_assigned" ? "Accept Delivery" : "View Order"}
            </button>
            <button type="button" onClick={handleDismiss}
              className="w-full h-12 rounded-2xl text-white/50 font-semibold text-sm flex items-center justify-center gap-2">
              <X className="h-4 w-4" /> Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
