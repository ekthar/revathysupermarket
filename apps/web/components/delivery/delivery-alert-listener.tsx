"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Package, X, MapPin, ArrowRight } from "lucide-react";

type AlertOrder = { id: string; orderNumber: string; customerName: string; address: string; total: number };

const DB_NAME = "msm-delivery-db";
const STORE_NAME = "alerts";
const SOUND_ENABLED_KEY = "delivery-alert-sound-enabled";
const AUDIO_UNLOCKED_KEY = "delivery-audio-unlocked";

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAlertOrder(order: AlertOrder): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(order);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getUnackedAlertOrders(): Promise<AlertOrder[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function clearAlertOrder(orderId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(orderId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearAllAlertOrders(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function DeliveryAlertListener({ partnerId }: { partnerId: string }) {
  const [alert, setAlert] = useState<AlertOrder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const alertOpenRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const isMountedRef = useRef(true);

  // Load persisted settings on mount
  useEffect(() => {
    const enabled = localStorage.getItem(SOUND_ENABLED_KEY) === "true";
    const unlocked = localStorage.getItem(AUDIO_UNLOCKED_KEY) === "true";
    setSoundEnabled(enabled);
    setAudioReady(unlocked);
    isMountedRef.current = true;

    // Sync IndexedDB alerts on cold start (beeping will start on next poll cycle)
    getUnackedAlertOrders().then((orders) => {
      if (isMountedRef.current && orders.length > 0 && !alertOpenRef.current) {
        alertOpenRef.current = true;
        setAlert(orders[0]);
      }
    }).catch(() => { /* ignore */ });

    return () => { isMountedRef.current = false; };
  }, []);

  const ensureContext = useCallback(async (): Promise<AudioContext | null> => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      try {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current = new Ctor();
      } catch { return null; }
    }
    if (ctxRef.current.state === "suspended") {
      try { await ctxRef.current.resume(); } catch { return null; }
    }
    return ctxRef.current;
  }, []);

  const enableSound = useCallback(async () => {
    const ctx = await ensureContext();
    if (!ctx) return;
    // Play a test beep to confirm
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; o.type = "square";
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    o.start(); o.stop(ctx.currentTime + 0.12);
    localStorage.setItem(SOUND_ENABLED_KEY, "true");
    localStorage.setItem(AUDIO_UNLOCKED_KEY, "true");
    setSoundEnabled(true);
    setAudioReady(true);
  }, [ensureContext]);

  // Auto-resume on any user interaction (page focus, click, etc.)
  useEffect(() => {
    const unlock = async () => {
      const ctx = await ensureContext();
      if (ctx) {
        localStorage.setItem(AUDIO_UNLOCKED_KEY, "true");
        setAudioReady(true);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") unlock();
    };
    window.addEventListener("click", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [ensureContext]);

  const startBeeping = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const beep = async () => {
      const ctx = await ensureContext();
      if (!ctx) return;
      // Three-tone ascending pattern
      const playTone = (freq: number, start: number, dur: number) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = "square";
        g.gain.setValueAtTime(0.25, ctx.currentTime + start);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
        o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur);
      };
      playTone(880, 0, 0.25);
      playTone(1100, 0.3, 0.25);
      playTone(1320, 0.6, 0.3);
      // Vibrate on every cycle, not just once, so the device keeps buzzing alongside the beeps.
      if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 500]);
    };
    beep();
    intervalRef.current = setInterval(beep, 2000);
  }, [ensureContext]);

  const stopBeeping = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  const checkForOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/delivery/poll", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const orders: AlertOrder[] = data.orders ?? [];
      const liveIds = new Set(orders.map((o) => o.id));

      // The server's unacknowledged list is authoritative. Reconcile IndexedDB against it
      // *before* the early-return below - any persisted alert the server no longer
      // considers pending (accepted via the notification's "Accept" action, another
      // device, etc.) must be purged, or it gets replayed as a phantom alarm forever.
      const persisted = await getUnackedAlertOrders();
      const stale = persisted.filter((p) => !liveIds.has(p.id));
      if (stale.length > 0) {
        await Promise.all(stale.map((p) => clearAlertOrder(p.id).catch(() => {})));
      }

      if (alertOpenRef.current) {
        // If the alert currently on screen was handled elsewhere in the meantime,
        // dismiss it automatically instead of leaving it stuck until manual action.
        setAlert((current) => {
          if (current && !liveIds.has(current.id)) {
            alertOpenRef.current = false;
            stopBeeping();
            return null;
          }
          return current;
        });
        return;
      }

      if (orders.length > 0) {
        alertOpenRef.current = true;
        const order = orders[0];
        setAlert(order);
        await saveAlertOrder(order); // Persist
        if (soundEnabled) {
          startBeeping();
        } else {
          // Try to auto-enable sound
          const ctx = await ensureContext();
          if (ctx) {
            localStorage.setItem(SOUND_ENABLED_KEY, "true");
            localStorage.setItem(AUDIO_UNLOCKED_KEY, "true");
            setSoundEnabled(true);
            setAudioReady(true);
            startBeeping();
          }
        }
      }
    } catch { /* ignore, retry next cycle */ }
  }, [soundEnabled, startBeeping, stopBeeping, ensureContext]);

  // Poll every 10 seconds
  useEffect(() => {
    if (!partnerId) return;
    let active = true;

    async function poll() {
      if (!active) return;
      await checkForOrders();
    }

    poll();
    const timer = setInterval(poll, 10000);
    return () => { active = false; clearInterval(timer); stopBeeping(); };
  }, [partnerId, checkForOrders, stopBeeping]);

  // Start beeping when alert becomes active and sound is enabled
  useEffect(() => {
    if (alert && soundEnabled && audioReady) {
      startBeeping();
    } else if (!alert) {
      stopBeeping();
    }
    return stopBeeping;
  }, [alert, soundEnabled, audioReady, startBeeping, stopBeeping]);

  // Visibility change: immediate poll when page becomes visible
  useEffect(() => {
    if (!partnerId) return;
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !alertOpenRef.current) {
        checkForOrders().catch(() => {});
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [partnerId, checkForOrders]);

  // Background Sync registration (for when app is closed)
  useEffect(() => {
    if ("serviceWorker" in navigator && "sync" in (window.ServiceWorkerRegistration.prototype as any)) {
      navigator.serviceWorker.ready.then((reg) => {
        // Register periodic sync for closed-app polling
        if ("periodicSync" in reg) {
          (reg as any).periodicSync.register("delivery-poll", { minInterval: 30000 }).catch(() => {});
        }
      });
    }
  }, []);

  const acknowledge = useCallback(async (reload: boolean) => {
    const orderId = alert?.id;
    setAlert(null);
    alertOpenRef.current = false;
    stopBeeping();
    if (!orderId) return;
    try {
      await fetch("/api/delivery/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      await clearAlertOrder(orderId);
    } catch { /* ignore */ }
    if (reload) window.location.reload();
  }, [alert?.id, stopBeeping]);

  return (
    <>
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