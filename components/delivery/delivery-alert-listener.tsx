"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Package, X, MapPin, ArrowRight } from "lucide-react";

type AlertOrder = { id: string; orderNumber: string; customerName: string; address: string; total: number };

/**
 * Delivery partner alert system.
 * Uses polling every 5 seconds to check for new assigned orders.
 * Plays continuous beeping + vibration until dismissed.
 * Works on Vercel (no long-lived SSE needed).
 */
export function DeliveryAlertListener({ partnerId }: { partnerId: string }) {
  const [alert, setAlert] = useState<AlertOrder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const knownOrdersRef = useRef<Set<string>>(new Set());
  const firstPollRef = useRef(true);

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
    intervalRef.current = setInterval(beep, 3000);
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
        const res = await fetch("/api/delivery/poll", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data = await res.json();
        const orders: Array<{ id: string; orderNumber: string; customerName: string; address: string; total: number }> = data.orders ?? [];

        // On first poll, just record known orders (don't alert for existing ones)
        if (firstPollRef.current) {
          firstPollRef.current = false;
          for (const o of orders) knownOrdersRef.current.add(o.id);
          return;
        }

        // Check for new orders not seen before
        for (const order of orders) {
          if (!knownOrdersRef.current.has(order.id)) {
            knownOrdersRef.current.add(order.id);
            setAlert(order);
            startBeeping();
            break; // Show one at a time
          }
        }
      } catch { /* network error, retry next cycle */ }
    }

    poll();
    const timer = setInterval(poll, 5000);
    return () => { active = false; clearInterval(timer); stopBeeping(); };
  }, [partnerId, startBeeping, stopBeeping]);

  const dismiss = useCallback(() => { setAlert(null); stopBeeping(); }, [stopBeeping]);

  return (
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
                <button onClick={dismiss} className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 font-bold text-slate-600 active:bg-slate-50 dark:border-slate-600 dark:text-slate-300"><X className="h-4 w-4" /> Dismiss</button>
                <a href="/delivery" onClick={stopBeeping} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-black text-white active:bg-emerald-700">View <ArrowRight className="h-4 w-4" /></a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
