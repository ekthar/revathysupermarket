"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<UnackOrder[]>([]);
  const [audioReady, setAudioReady] = useState(false);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [acceptingAll, setAcceptingAll] = useState(false);
  const { showToast } = useToast();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Browsers block autoplay until the user interacts with the page.
  useEffect(() => {
    const unlock = () => {
      if (ensureContext()) setAudioReady(true);
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
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
        setOrders(data.orders ?? []);
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
          .then((data) => setOrders(data.orders ?? []))
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
    try {
      await Promise.all(
        orders.map((o) =>
          fetch(`/api/admin/orders/${o.id}/acknowledge`, { method: "POST" })
        )
      );
      setOrders([]);
      showToast(`${orders.length} order${orders.length > 1 ? "s" : ""} accepted`, "success");
    } catch {
      showToast("Could not accept all orders", "error");
    } finally {
      setAcceptingAll(false);
    }
  }, [orders, showToast]);

  const hasOrders = orders.length > 0;

  return (
    <>
      {children}
      {hasOrders && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border-4 border-red-500 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-5 bg-red-600 text-white rounded-t-xl">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <BellRing className="h-7 w-7 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black uppercase tracking-wider">New Order Alert</h2>
                <p className="text-sm text-red-100">
                  {orders.length} order{orders.length > 1 ? "s" : ""} waiting — accept to silence the alarm
                </p>
              </div>
            </div>

            {/* Audio autoplay unlock prompt */}
            {!audioReady && (
              <div className="px-6 py-4 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
                <button
                  type="button"
                  onClick={() => { if (ensureContext()) setAudioReady(true); }}
                  className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 transition"
                >
                  <Volume2 className="h-5 w-5" /> Tap to Enable Alarm Sound
                </button>
              </div>
            )}

            {/* Order list */}
            <div className="px-6 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
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
                    className="w-full mt-3"
                    onClick={() => acceptOrder(order.id)}
                    disabled={acknowledging === order.id}
                  >
                    {acknowledging === order.id ? "Accepting..." : "Accept Order"}
                  </Button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
              {orders.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full h-12 text-base font-bold"
                  onClick={acceptAll}
                  disabled={acceptingAll}
                >
                  {acceptingAll ? "Accepting all..." : `Accept All (${orders.length})`}
                </Button>
              )}
              <Link
                href="/admin/orders"
                className="w-full h-11 rounded-2xl border border-slate-300 dark:border-slate-600 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                View on Orders Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
