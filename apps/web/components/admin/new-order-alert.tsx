"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Phone, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type NewOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  total: number;
  itemCount: number;
  createdAt: string;
};

export function NewOrderAlert() {
  const pathname = usePathname();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<NewOrder[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const lastCountRef = useRef(0);

  const playSound = useCallback(() => {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") ctx.resume();

      // Play a pleasant notification chime
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Three-note chime (C5 → E5 → G5)
      playTone(523, 0, 0.15);
      playTone(659, 0.12, 0.15);
      playTone(784, 0.24, 0.2);
    } catch {
      // Audio not available
    }
  }, []);

  useEffect(() => {
    if (pathname === "/admin/orders") return;
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/admin/orders/unacknowledged", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data = await res.json();
        setOrders(data.orders ?? []);

        // Play sound if new orders appeared
        if (data.count > lastCountRef.current && lastCountRef.current >= 0) {
          playSound();
        }
        lastCountRef.current = data.count;
      } catch {
        // Silent fail
      }
    }

    poll();
    const interval = setInterval(poll, 5000);
    return () => { active = false; clearInterval(interval); audioRef.current?.close().catch(() => undefined); audioRef.current = null; };
  }, [pathname, playSound]);

  async function acknowledge(orderId: string) {
    setAcknowledging(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/acknowledge`, { method: "POST" });
      if (!response.ok) {
        showToast("Order could not be acknowledged", "error");
        return;
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      showToast("Order could not be acknowledged", "error");
    } finally {
      setAcknowledging(null);
    }
  }

  const visible = orders.filter((o) => !dismissed.has(o.id));

  if (pathname === "/admin/orders" || visible.length === 0) return null;

  return (
    <div className="fixed top-16 inset-x-0 z-[60] pointer-events-none px-4 flex flex-col items-center gap-2">
      <AnimatePresence>
        {visible.slice(0, 3).map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-elevation-2 border border-slate-200/80 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-orange-100">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center pulse-ring">
                <Bell className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold text-orange-900">New Order #{order.orderNumber}</p>
                <p className="text-caption text-orange-600">{new Date(order.createdAt).toLocaleTimeString()}</p>
              </div>
              <button
                type="button"
                aria-label={`Dismiss alert for order ${order.orderNumber}`}
                onClick={() => setDismissed((s) => new Set([...s, order.id]))}
                className="h-7 w-7 rounded-full bg-white/80 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body font-semibold text-slate-900">{order.customerName}</p>
                  <p className="text-caption text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {order.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-title font-bold text-slate-900">{formatCurrency(order.total)}</p>
                  <p className="text-caption text-slate-400 flex items-center gap-1 justify-end">
                    <ShoppingBag className="h-3 w-3" /> {order.itemCount} items
                  </p>
                </div>
              </div>
            </div>

            {/* Accept button */}
            <div className="px-4 pb-3">
              <button
                type="button"
                onClick={() => acknowledge(order.id)}
                disabled={acknowledging === order.id}
                className="w-full h-10 rounded-xl bg-primary text-white text-body font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition disabled:opacity-60"
              >
                {acknowledging === order.id ? "Accepting..." : "Accept Order"}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
