"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Phone, ShoppingBag, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";

type UnackOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  total: number;
  itemCount: number;
  createdAt: string;
};

// Persists whether the admin has already unlocked the siren once before, so a reload
// (or a closed-and-reopened PWA) doesn't show "Tap to Enable Alarm Sound" again if the
// browser is willing to resume the AudioContext without a fresh gesture this time.
const AUDIO_UNLOCKED_KEY = "admin-alarm-audio-unlocked";

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<UnackOrder[]>([]);
  const [audioReady, setAudioReady] = useState(false);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [acceptingAll, setAcceptingAll] = useState(false);
  const { showToast } = useToast();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Orders accepted locally but not yet confirmed absent from the server's
  // /unacknowledged response. Without this, the 5s poll can re-add an order the admin
  // just accepted (if the ack write hasn't propagated to that read yet), reopening the
  // modal and restarting the siren a few seconds after it was silenced.
  const acceptedIdsRef = useRef<Set<string>>(new Set());

  const ensureContext = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new Ctor();
      } catch {
        return null;
      }
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => undefined);
    }
    return audioCtxRef.current;
  }, []);

  // Continuous, high-volume siren burst via the Web Audio API.
  const playBurst = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "closed") return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";

    // Siren sweep 600 -> 1200 -> 600 Hz for an attention-grabbing alarm.
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
    osc.frequency.linearRampToValueAtTime(600, now + 0.6);

    // Loud, sustained envelope.
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.6, now + 0.02);
    gain.gain.setValueAtTime(0.6, now + 0.55);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.66);

    osc.start(now);
    osc.stop(now + 0.7);
  }, []);

  const startAlarm = useCallback(() => {
    if (alarmTimerRef.current) return;
    playBurst();
    alarmTimerRef.current = setInterval(playBurst, 750);
  }, [playBurst]);

  const stopAlarm = useCallback(() => {
    if (alarmTimerRef.current) {
      clearInterval(alarmTimerRef.current);
      alarmTimerRef.current = null;
    }
  }, []);

  // If the admin unlocked the siren on a previous visit, trust that going forward: hide
  // the prompt immediately and try to resume the AudioContext right away. Some browsers
  // (especially an installed/TWA origin with a history of user-initiated audio) allow
  // this to succeed with no fresh gesture at all; when they don't, the very next click,
  // keydown, touch, or tab-foreground event below silently finishes the resume for us.
  useEffect(() => {
    if (localStorage.getItem(AUDIO_UNLOCKED_KEY) === "true") {
      setAudioReady(true);
      ensureContext();
    }
  }, [ensureContext]);

  // Browsers block autoplay until the user interacts with the page. Beyond the first
  // click/keydown/touch, also retry silently whenever the tab/app is foregrounded again -
  // that covers switching back to an installed PWA without a full close, where the
  // AudioContext is often still alive and just needs another resume() call.
  useEffect(() => {
    const unlock = () => {
      if (ensureContext()) {
        localStorage.setItem(AUDIO_UNLOCKED_KEY, "true");
        setAudioReady(true);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") unlock();
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [ensureContext]);

  // Poll for unacknowledged orders every 5 seconds.
  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const res = await fetch("/api/admin/orders/unacknowledged", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data = await res.json();
        const fresh: UnackOrder[] = data.orders ?? [];
        setOrders(fresh.filter((o) => !acceptedIdsRef.current.has(o.id)));
      } catch {
        // silent
      }
    }
    poll();
    const interval = setInterval(poll, 5000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // React instantly to push-notification broadcasts by re-polling.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "HEAVY_ALARM" && event.data.payload?.type === "new_order_alert") {
        fetch("/api/admin/orders/unacknowledged", { cache: "no-store" })
          .then((r) => r.json())
          .then((data) => {
            const fresh: UnackOrder[] = data.orders ?? [];
            setOrders(fresh.filter((o) => !acceptedIdsRef.current.has(o.id)));
          })
          .catch(() => undefined);
      }
    };
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handleMessage);
    }
    return () => {
      if (typeof navigator !== "undefined" && navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
    };
  }, []);

  // Ring while unacknowledged orders exist; stop only when none remain.
  useEffect(() => {
    if (orders.length > 0 && audioReady) {
      startAlarm();
    } else {
      stopAlarm();
    }
    return stopAlarm;
  }, [orders.length, audioReady, startAlarm, stopAlarm]);

  // Cleanup audio on unmount.
  useEffect(() => {
    return () => {
      stopAlarm();
      audioCtxRef.current?.close().catch(() => undefined);
    };
  }, [stopAlarm]);

  const acceptOrder = useCallback(async (orderId: string) => {
    setAcknowledging(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/acknowledge`, { method: "POST" });
      if (!res.ok) {
        showToast("Order could not be accepted", "error");
        return;
      }
      acceptedIdsRef.current.add(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast("Order accepted", "success");
    } catch {
      showToast("Order could not be accepted", "error");
    } finally {
      setAcknowledging(null);
    }
  }, [showToast]);

  const acceptAll = useCallback(async () => {
    setAcceptingAll(true);
    const targets = orders;
    try {
      // Track each order's own outcome instead of Promise.all - one failed acknowledge
      // shouldn't hide the fact that the others actually succeeded.
      const results = await Promise.allSettled(
        targets.map((o) => fetch(`/api/admin/orders/${o.id}/acknowledge`, { method: "POST" }).then((res) => {
          if (!res.ok) throw new Error("acknowledge failed");
          return o.id;
        }))
      );
      const succeededIds = new Set(
        results.filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled").map((r) => r.value)
      );
      succeededIds.forEach((id) => acceptedIdsRef.current.add(id));
      setOrders((prev) => prev.filter((o) => !succeededIds.has(o.id)));

      const failedCount = targets.length - succeededIds.size;
      if (failedCount === 0) {
        showToast(`${targets.length} order${targets.length > 1 ? "s" : ""} accepted`, "success");
      } else if (succeededIds.size === 0) {
        showToast("Could not accept all orders", "error");
      } else {
        showToast(`${succeededIds.size} accepted, ${failedCount} failed - retry the rest`, "error");
      }
    } finally {
      setAcceptingAll(false);
    }
  }, [orders, showToast]);

  const hasOrders = orders.length > 0;

  return (
    <>
      {children}
      <AnimatePresence>
        {hasOrders && (
          <motion.div
            key="alarm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4"
            style={{ background: "radial-gradient(circle at 50% 0%, rgba(239,68,68,0.25), rgba(0,0,0,0.85) 70%)" }}
          >
            {/* Strobing edge flash — the "beacon light" of the alarm */}
            <motion.div
              className="pointer-events-none fixed inset-0 z-0"
              animate={{ boxShadow: ["inset 0 0 0px rgba(239,68,68,0)", "inset 0 0 140px rgba(239,68,68,0.55)", "inset 0 0 0px rgba(239,68,68,0)"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="relative z-10 bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-[0_0_60px_rgba(239,68,68,0.35)] border-4 border-red-500 my-8 overflow-hidden"
            >
              {/* Header */}
              <div className="relative flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white overflow-hidden">
                <motion.div
                  className="absolute inset-0 opacity-40"
                  style={{ background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent)" }}
                  animate={{ x: ["-120%", "220%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative h-12 w-12 shrink-0 flex items-center justify-center">
                  <motion.span
                    className="absolute inset-0 rounded-full bg-white/40"
                    animate={{ scale: [1, 1.9, 1.9], opacity: [0.7, 0, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                  <div className="relative h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                    <motion.span
                      animate={{ rotate: [0, -18, 18, -12, 12, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <BellRing className="h-7 w-7" />
                    </motion.span>
                  </div>
                </div>
                <div className="relative flex-1 min-w-0">
                  <h2 className="text-xl font-black uppercase tracking-wider">New Order Alert</h2>
                  <p className="text-sm text-red-100">
                    {orders.length} order{orders.length > 1 ? "s" : ""} waiting — accept to silence the alarm
                  </p>
                </div>
              </div>

              {/* Audio autoplay unlock prompt */}
              {!audioReady && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 py-4 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20"
                >
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (ensureContext()) {
                        localStorage.setItem(AUDIO_UNLOCKED_KEY, "true");
                        setAudioReady(true);
                      }
                    }}
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    whileTap={{ scale: 0.96 }}
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Volume2 className="h-5 w-5" /> Tap to Enable Alarm Sound
                  </motion.button>
                </motion.div>
              )}

              {/* Order list */}
              <div className="px-6 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 320, damping: 28, delay: index * 0.04 }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-white">#{order.orderNumber}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{order.customerName}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{order.phone}</span>
                            <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{order.itemCount} items</span>
                          </div>
                        </div>
                        <p className="font-black text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(order.total)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="w-full mt-3 active:scale-[0.97] transition-transform"
                        onClick={() => acceptOrder(order.id)}
                        disabled={acknowledging === order.id}
                      >
                        {acknowledging === order.id ? "Accepting..." : "Accept Order"}
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                {orders.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full h-12 text-base font-bold active:scale-[0.97] transition-transform"
                    onClick={acceptAll}
                    disabled={acceptingAll}
                  >
                    {acceptingAll ? "Accepting all..." : `Accept All (${orders.length})`}
                  </Button>
                )}
                <Link
                  href="/admin/orders"
                  className="w-full h-11 rounded-2xl border border-slate-300 dark:border-slate-600 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:-translate-y-0.5 transition"
                >
                  View on Orders Page
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
