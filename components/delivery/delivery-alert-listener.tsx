"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Package, X, MapPin, ArrowRight, Volume2 } from "lucide-react";

type AlertOrder = { id: string; orderNumber: string; customerName: string; address: string; total: number };

/**
 * Delivery partner alert system.
 * Uses polling every 5 seconds to check for new assigned orders.
 * Plays continuous beeping + vibration until dismissed.
 * Works on Vercel (no long-lived SSE needed).
 *
 * The server only returns unacknowledged orders (deliveryAlertAckAt = null),
 * so ANY order returned should always trigger the fullscreen alert.
 * No client-side deduplication is needed.
 */
export function DeliveryAlertListener({ partnerId }: { partnerId: string }) {
  const [alert, setAlert] = useState<AlertOrder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const alertOpenRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    setSoundEnabled(localStorage.getItem("delivery-alert-sound-enabled") === "true");
  }, []);

  const enableSound = useCallback(async () => {
    try {
      if (!ctxRef.current || ctxRef.current.state === "closed") ctxRef.current = new AudioContext();
      await ctxRef.current.resume();
      const oscillator = ctxRef.current.createOscillator();
      const gain = ctxRef.current.createGain();
      oscillator.connect(gain); gain.connect(ctxRef.current.destination);
      gain.gain.setValueAtTime(0.08, ctxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctxRef.current.currentTime + 0.12);
      oscillator.start(); oscillator.stop(ctxRef.current.currentTime + 0.12);
      localStorage.setItem("delivery-alert-sound-enabled", "true");
      setSoundEnabled(true);
    } catch { /* device has no usable Web Audio implementation */ }
  }, []);

  /** Attempt to create/resume AudioContext programmatically (may succeed if page had prior user interaction). */
  const tryAutoEnableSound = useCallback(() => {
    try {
      if (!ctxRef.current || ctxRef.current.state === "closed") ctxRef.current = new AudioContext();
      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume().then(() => {
          localStorage.setItem("delivery-alert-sound-enabled", "true");
          setSoundEnabled(true);
        }).catch(() => { /* browser blocked auto-resume, visual alert still shows */ });
      } else if (ctxRef.current.state === "running") {
        localStorage.setItem("delivery-alert-sound-enabled", "true");
        setSoundEnabled(true);
      }
    } catch { /* audio unavailable */ }
  }, []);

  const startBeeping = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const beep = () => {
      try {
        if (!ctxRef.current || ctxRef.current.state === "closed") ctxRef.current = new AudioContext();
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") ctx.resume();
        // Tone 1
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(880, ctx.currentTime); o.type = "square";
        g.gain.setValueAtTime(0.25, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.25);
        // Tone 2
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.setValueAtTime(1100, ctx.currentTime + 0.3); o2.type = "square";
        g2.gain.setValueAtTime(0.25, ctx.currentTime + 0.3);
        g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
        o2.start(ctx.currentTime + 0.3); o2.stop(ctx.currentTime + 0.55);
        // Tone 3
        const o3 = ctx.createOscillator(); const g3 = ctx.createGain();
        o3.connect(g3); g3.connect(ctx.destination);
        o3.frequency.setValueAtTime(1320, ctx.currentTime + 0.6); o3.type = "square";
        g3.gain.setValueAtTime(0.25, ctx.currentTime + 0.6);
        g3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
        o3.start(ctx.currentTime + 0.6); o3.stop(ctx.currentTime + 0.9);
      } catch { /* audio unavailable */ }
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
    };
    beep();
    intervalRef.current = setInterval(beep, 2000);
  }, []);

  const stopBeeping = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  // Poll for new orders every 5 seconds
  useEffect(() => {
    if (!partnerId) return;
    let active = true;

    async function poll() {
      try {
        if (alertOpenRef.current) return;
        const res = await fetch("/api/delivery/poll", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data = await res.json();
        const orders: Array<{ id: string; orderNumber: string; customerName: string; address: string; total: number }> = data.orders ?? [];

        // The server only returns unacknowledged assignments.
        // If any orders are returned and no alert is open, show immediately.
        if (orders.length > 0 && !alertOpenRef.current) {
          alertOpenRef.current = true;
          setAlert(orders[0]);
          // Attempt sound: if enabled start beeping, otherwise try auto-enable
          if (localStorage.getItem("delivery-alert-sound-enabled") === "true") {
            startBeeping();
          } else {
            // Try to auto-resume AudioContext (may work if page had prior interaction)
            tryAutoEnableSound();
            // If sound was successfully enabled, start beeping
            setTimeout(() => {
              if (localStorage.getItem("delivery-alert-sound-enabled") === "true") {
                startBeeping();
              }
            }, 100);
          }
        }
      } catch { /* network error, retry next cycle */ }
    }

    poll();
    const timer = setInterval(poll, 5000);
    return () => { active = false; clearInterval(timer); stopBeeping(); };
  }, [partnerId, startBeeping, stopBeeping, tryAutoEnableSound]);

  // Visibility change: trigger immediate poll when page becomes visible
  useEffect(() => {
    if (!partnerId) return;

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !alertOpenRef.current) {
        // Immediate poll when page is foregrounded
        fetch("/api/delivery/poll", { cache: "no-store" })
          .then((res) => {
            if (!res.ok) return;
            return res.json();
          })
          .then((data) => {
            if (!data) return;
            const orders: Array<{ id: string; orderNumber: string; customerName: string; address: string; total: number }> = data.orders ?? [];
            if (orders.length > 0 && !alertOpenRef.current) {
              alertOpenRef.current = true;
              setAlert(orders[0]);
              if (localStorage.getItem("delivery-alert-sound-enabled") === "true") {
                startBeeping();
              } else {
                tryAutoEnableSound();
                setTimeout(() => {
                  if (localStorage.getItem("delivery-alert-sound-enabled") === "true") {
                    startBeeping();
                  }
                }, 100);
              }
            }
          })
          .catch(() => { /* ignore, regular poll will retry */ });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [partnerId, startBeeping, tryAutoEnableSound]);

  const acknowledge = useCallback(async (reload: boolean) => {
    const orderId = alert?.id;
    setAlert(null);
    alertOpenRef.current = false;
    stopBeeping();
    if (!orderId) return;
    await fetch("/api/delivery/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId })
    }).catch(() => null);
    if (reload) window.location.reload();
  }, [alert?.id, stopBeeping]);

  return (
    <>
      {!soundEnabled && (
        <button type="button" onClick={enableSound} className="fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl dark:bg-white dark:text-slate-950">
          <Volume2 className="h-4 w-4" /> Enable assignment alarm
        </button>
      )}
      <AnimatePresence>
      {alert && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/95 p-4">
          <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8 }} transition={{ type: "spring", damping: 20 }} className="w-full max-w-sm rounded-3xl bg-white shadow-2xl dark:bg-slate-800 overflow-hidden">
            <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white overflow-hidden">
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/20" />
              <div className="relative flex items-center gap-4">
                <motion.div animate={{ rotate: [-15, 15, -15] }} transition={{ repeat: Infinity, duration: 0.5 }} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20"><Bell className="h-7 w-7" /></motion.div>
                <div><p className="text-sm font-bold opacity-90">NEW ORDER!</p><p className="text-3xl font-black">#{alert.orderNumber}</p></div>
              </div>
            </div>
            <div className="p-5">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/50">
                <div className="flex items-start gap-3">
                  <Package className="mt-0.5 h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 dark:text-white">{alert.customerName}</p>
                    <p className="mt-1 flex items-start gap-1 text-sm text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="line-clamp-2">{alert.address}</span></p>
                    <p className="mt-3 text-2xl font-black text-emerald-600">{"\u20B9"}{alert.total.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => void acknowledge(false)} className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 font-bold text-slate-600 active:bg-slate-50 dark:border-slate-600 dark:text-slate-300"><X className="h-4 w-4" /> Dismiss</button>
                <button type="button" onClick={() => void acknowledge(true)} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-black text-white active:bg-emerald-700">View <ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
