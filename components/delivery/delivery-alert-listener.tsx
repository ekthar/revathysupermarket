"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Package, X, MapPin, ArrowRight } from "lucide-react";

type AlertOrder = { id: string; orderNumber: string; customerName: string; address: string; total: number };

/**
 * Continuous beeping alert for delivery partners via SSE.
 * Does NOT stop until manually dismissed.
 */
export function DeliveryAlertListener({ partnerId }: { partnerId: string }) {
  const [alert, setAlert] = useState<AlertOrder | null>(null);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const startBeeping = useCallback(() => {
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    const beep = () => {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") audioCtxRef.current = new AudioContext();
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.type = "square";
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        // Second tone
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.35);
        osc2.type = "square";
        gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.35);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
        osc2.start(ctx.currentTime + 0.35);
        osc2.stop(ctx.currentTime + 0.65);
      } catch { /* audio unavailable */ }
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
    };
    beep();
    audioIntervalRef.current = setInterval(beep, 3000);
  }, []);

  const stopBeeping = useCallback(() => {
    if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  useEffect(() => {
    if (!partnerId) return;
    let es: EventSource | null = null;
    let reconnect: ReturnType<typeof setTimeout>;
    function connect() {
      es = new EventSource(`/api/delivery/alerts?partnerId=${encodeURIComponent(partnerId)}`);
      es.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data);
          if (d.type === "new_order") { setAlert(d.order); startBeeping(); }
        } catch { /* ignore */ }
      };
      es.onerror = () => { es?.close(); reconnect = setTimeout(connect, 5000); };
    }
    connect();
    return () => { es?.close(); clearTimeout(reconnect); stopBeeping(); };
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
                <motion.div animate={{ rotate: [-15, 15, -15] }} transition={{ repeat: Infinity, duration: 0.5 }} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                  <Bell className="h-7 w-7" />
                </motion.div>
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
