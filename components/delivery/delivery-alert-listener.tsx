"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Package, X, MapPin, ArrowRight } from "lucide-react";

type AlertOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  total: number;
};

/**
 * Real-time alert listener for delivery partners.
 * Uses Server-Sent Events (SSE) to receive instant order alerts.
 * Shows a persistent full-screen alert with audio + vibration when a new order is assigned.
 */
export function DeliveryAlertListener({ partnerId }: { partnerId: string }) {
  const [alert, setAlert] = useState<AlertOrder | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Play alert sound using Web Audio API
  const playAlertSound = useCallback(() => {
    try {
      const ctx = audioContext || new AudioContext();
      if (!audioContext) setAudioContext(ctx);

      // Create a two-tone alert sound
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
        oscillator.start(ctx.currentTime + startTime);
        oscillator.stop(ctx.currentTime + startTime + duration);
      };

      // Attention-grabbing pattern: 3 ascending tones
      playTone(523, 0, 0.2);    // C5
      playTone(659, 0.25, 0.2); // E5
      playTone(784, 0.5, 0.3);  // G5
      playTone(523, 0.9, 0.2);  // C5 again
      playTone(659, 1.15, 0.2); // E5
      playTone(784, 1.4, 0.3);  // G5
    } catch {
      // Audio not available
    }
  }, [audioContext]);

  // Vibration pattern for alerts
  const vibrateAlert = useCallback(() => {
    if (navigator.vibrate) {
      // Long vibration pattern to get attention
      navigator.vibrate([300, 100, 300, 100, 300, 200, 500]);
    }
  }, []);

  // SSE connection for real-time order alerts
  useEffect(() => {
    if (!partnerId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      eventSource = new EventSource(`/api/delivery/alerts?partnerId=${encodeURIComponent(partnerId)}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_order") {
            setAlert(data.order);
            playAlertSound();
            vibrateAlert();

            // Re-alert every 10 seconds if not dismissed
            const reAlert = setInterval(() => {
              setAlert((current) => {
                if (current?.id === data.order.id) {
                  playAlertSound();
                  vibrateAlert();
                  return current;
                }
                clearInterval(reAlert);
                return current;
              });
            }, 10000);

            // Auto-dismiss after 60 seconds
            setTimeout(() => {
              clearInterval(reAlert);
              setAlert((current) => (current?.id === data.order.id ? null : current));
            }, 60000);
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after 5 seconds
        reconnectTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [partnerId, playAlertSound, vibrateAlert]);

  const dismissAlert = () => setAlert(null);

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-800"
          >
            {/* Pulsing header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10"
              />
              <div className="relative flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Bell className="h-8 w-8" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold opacity-90">New Order Assigned!</p>
                  <p className="text-2xl font-black">#{alert.orderNumber}</p>
                </div>
              </div>
            </div>

            {/* Order details */}
            <div className="p-5">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/50">
                <Package className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{alert.customerName}</p>
                  <p className="mt-1 flex items-start gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                    {alert.address}
                  </p>
                  <p className="mt-2 text-lg font-black text-emerald-600">
                    ₹{alert.total.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={dismissAlert}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 font-bold text-slate-600 dark:border-slate-600 dark:text-slate-300"
                >
                  <X className="h-4 w-4" /> Dismiss
                </button>
                <a
                  href="/delivery"
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white"
                >
                  View <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
