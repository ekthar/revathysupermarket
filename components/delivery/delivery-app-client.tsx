"use client";

import { useEffect, useState } from "react";
import { Bike, CheckCircle2, CreditCard, ExternalLink, IndianRupee, MapPin, Package, Phone, ShieldCheck, Truck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { readApiResponse } from "@/lib/client-api";
import { statusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";
import { InstallAppButton } from "@/components/install-app-button";
import { SlideToConfirm } from "@/components/delivery/slide-to-confirm";

type DeliveryOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  status: string;
  total: number;
  paymentMethod: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  collection?: { expectedAmount: number; cashCollected: number; upiCollected: number; upiReference: string | null; status: string } | null;
};

type Stats = {
  todayDelivered: number;
  todayCashCollected: number;
  todayUpiCollected: number;
  totalDelivered: number;
  activeOrders: number;
};

export function DeliveryAppClient({ partnerName, stats, orders }: { partnerName: string; stats: Stats; orders: DeliveryOrder[] }) {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<DeliveryOrder[]>(() =>
    orders.map((entry) => entry.status === "OUT_FOR_DELIVERY" ? { ...entry, status: "ARRIVING" } : entry)
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [damageOrder, setDamageOrder] = useState<DeliveryOrder | null>(null);
  const [collectOrder, setCollectOrder] = useState<DeliveryOrder | null>(null);
  const [completeOrder, setCompleteOrder] = useState<DeliveryOrder | null>(null);

  // GPS publishing
  useEffect(() => {
    if (!navigator.geolocation) return;
    let lastPublishedAt = 0;
    let request: AbortController | null = null;
    const watch = navigator.geolocation.watchPosition((position) => {
      const now = Date.now();
      if (document.visibilityState === "hidden" || now - lastPublishedAt < 5000) return;
      lastPublishedAt = now;
      request?.abort();
      request = new AbortController();
      void fetch("/api/delivery/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        signal: request.signal
      }).catch(() => null);
    }, () => undefined, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
    return () => { request?.abort(); navigator.geolocation.clearWatch(watch); };
  }, []);

  async function pickup(order: DeliveryOrder) {
    setLoading(order.id);
    const response = await fetch(`/api/delivery/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "picked_up" }) });
    const data = await readApiResponse<{ error?: string }>(response);
    setLoading(null);
    if (!response.ok) return showToast(data.error ?? "Pickup update failed", "error");
    if (navigator.vibrate) navigator.vibrate(50);
    setEntries((current) => current.map((entry) => entry.id === order.id ? { ...entry, status: "ARRIVING" } : entry));
    showToast("Picked up! Head to customer", "success");
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-emerald-600 px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] dark:bg-emerald-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-100">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</p>
            <h1 className="text-xl font-black text-white">{partnerName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Bike className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatCard icon={<Package className="h-4 w-4" />} label="Today" value={String(stats.todayDelivered)} />
          <StatCard icon={<IndianRupee className="h-4 w-4" />} label="Collected" value={formatCurrency(stats.todayCashCollected + stats.todayUpiCollected)} />
          <StatCard icon={<Zap className="h-4 w-4" />} label="Lifetime" value={String(stats.totalDelivered)} />
        </div>
      </header>

      {/* Active Orders Count */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Active Orders <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">{entries.length}</span>
          </h2>
          <InstallAppButton compact />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4 px-5 pb-6 pt-4">
        <AnimatePresence>
          {entries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
              <Package className="h-16 w-16 text-slate-200 dark:text-slate-700" />
              <p className="mt-4 text-lg font-black text-slate-400">No active orders</p>
              <p className="mt-1 text-sm text-slate-400">New assignments will appear here instantly</p>
            </motion.div>
          ) : (
            entries.map((order, idx) => (
              <motion.article
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: idx * 0.05 }}
                className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                      <Package className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900 dark:text-white">#{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(order.total)}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${
                      order.status === "READY_FOR_DELIVERY" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                      order.status === "ARRIVING" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }`}>
                      {statusLabels[order.status as keyof typeof statusLabels] ?? order.status}
                    </span>
                  </div>
                </div>

                {/* Payment badge */}
                <div className="flex items-center gap-2 px-4 pt-3">
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${
                    order.paymentMethod === "COD" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" :
                    order.paymentMethod === "UPI_ON_DELIVERY" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" :
                    order.paymentMethod === "CARD" ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {order.paymentMethod === "COD" && <IndianRupee className="h-3 w-3" />}
                    {order.paymentMethod === "UPI_ON_DELIVERY" && <Phone className="h-3 w-3" />}
                    {order.paymentMethod === "CARD" && <CreditCard className="h-3 w-3" />}
                    {order.paymentMethod === "COD" ? "Cash" : order.paymentMethod === "UPI_ON_DELIVERY" ? "UPI" : order.paymentMethod === "CARD" ? "Card" : "Wallet"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{order.items.length} items</span>
                </div>

                {/* Address */}
                <button
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`, "_blank")}
                  className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-start gap-2 rounded-xl bg-slate-50 p-3 text-left active:bg-slate-100 dark:bg-slate-800 dark:active:bg-slate-700"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="flex-1 text-sm leading-snug text-slate-700 dark:text-slate-300">{order.address}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                </button>

                {/* Items expandable */}
                <details className="mx-4 mt-3">
                  <summary className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-700">View {order.items.length} items</summary>
                  <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between py-2 text-sm">
                        <span className="text-slate-700 dark:text-slate-300">{item.name} x{item.quantity}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </details>

                {/* Action Buttons */}
                <div className="mt-4 grid gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
                  {/* Call customer */}
                  <a href={`tel:${order.phone}`} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 active:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                    <Phone className="h-4 w-4" /> Call Customer
                  </a>

                  {/* Pickup */}
                  {order.status === "READY_FOR_DELIVERY" && (
                    <button
                      disabled={loading === order.id}
                      onClick={() => pickup(order)}
                      className="flex h-14 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-base font-black text-white active:bg-emerald-700 disabled:opacity-50"
                    >
                      <Truck className="h-5 w-5" />
                      {loading === order.id ? "Updating..." : "Confirm Pickup"}
                    </button>
                  )}

                  {/* Arriving — collection & damage */}
                  {order.status === "ARRIVING" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setDamageOrder(order)} className="h-12 rounded-xl border border-red-200 text-sm font-bold text-red-600 active:bg-red-50 dark:border-red-800 dark:text-red-400">
                        Report Issue
                      </button>
                      <button onClick={() => setCollectOrder(order)} className="h-12 rounded-xl bg-blue-600 text-sm font-black text-white active:bg-blue-700">
                        Collect Payment
                      </button>
                    </div>
                  )}

                  {/* Complete delivery */}
                  {order.status === "ARRIVING" && order.collection && !["SHORT", "EXCESS"].includes(order.collection.status) && (
                    <button
                      onClick={() => setCompleteOrder(order)}
                      className="flex h-14 items-center justify-center gap-2 rounded-xl bg-slate-900 text-base font-black text-white active:bg-slate-800 dark:bg-white dark:text-slate-900"
                    >
                      <ShieldCheck className="h-5 w-5" /> Complete Delivery
                    </button>
                  )}
                </div>
              </motion.article>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      {damageOrder && <DamageDialog order={damageOrder} onClose={() => setDamageOrder(null)} onSaved={() => showToast("Damage recorded", "success")} />}
      {collectOrder && <CollectionDialog order={collectOrder} onClose={() => setCollectOrder(null)} onSaved={(collection) => { setEntries((c) => c.map((e) => e.id === collectOrder.id ? { ...e, collection } : e)); setCollectOrder(null); showToast("Collection saved", "success"); }} />}
      {completeOrder && <CompletionDialog order={completeOrder} onClose={() => setCompleteOrder(null)} onComplete={() => { setEntries((c) => c.filter((e) => e.id !== completeOrder.id)); setCompleteOrder(null); showToast("Delivery completed!", "success"); if (navigator.vibrate) navigator.vibrate(200); }} />}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-emerald-100">{icon}<span className="text-[10px] font-bold">{label}</span></div>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

/* === Damage Dialog === */
function DamageDialog({ order, onClose, onSaved }: { order: DeliveryOrder; onClose: () => void; onSaved: () => void }) {
  const [itemId, setItemId] = useState(order.items[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/evidence/upload", { method: "POST", body });
    const data = await res.json();
    if (res.ok) setEvidenceUrl(data.url);
    else setError(data.error ?? "Upload failed");
  }

  async function submit() {
    setSubmitting(true);
    const res = await fetch("/api/delivery/damage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, orderItemId: itemId, quantity, reason, reductionAmount: Number(amount), evidenceUrl: evidenceUrl || undefined }) });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) return setError(data.error ?? "Failed");
    onSaved();
    onClose();
  }

  return (
    <BottomSheet title="Report Damage" onClose={onClose}>
      <label className="block text-sm font-bold">Item
        <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
          {order.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-sm font-bold">Qty<input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-800" /></label>
        <label className="text-sm font-bold">Reduce ₹<input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-800" /></label>
      </div>
      <label className="mt-3 block text-sm font-bold">Reason<textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-800" /></label>
      <label className="mt-3 block text-sm font-bold">Photo evidence<input type="file" accept="image/*" capture="environment" onChange={(e) => upload(e.target.files?.[0])} className="mt-1 block w-full text-sm" /></label>
      {evidenceUrl && <p className="mt-2 text-xs font-bold text-emerald-600">Photo uploaded</p>}
      {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}
      <button disabled={submitting} onClick={submit} className="mt-4 h-14 w-full rounded-xl bg-red-600 font-black text-white disabled:opacity-50">{submitting ? "Saving..." : "Submit Report"}</button>
    </BottomSheet>
  );
}

/* === Collection Dialog (with Card option) === */
function CollectionDialog({ order, onClose, onSaved }: { order: DeliveryOrder; onClose: () => void; onSaved: (collection: NonNullable<DeliveryOrder["collection"]>) => void }) {
  const [cash, setCash] = useState("");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    // Card amount is added to UPI for backend (both are non-cash digital payments)
    const totalUpi = Number(upi || 0) + Number(card || 0);
    const res = await fetch("/api/delivery/collect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, cashCollected: Number(cash || 0), upiCollected: totalUpi, upiReference: reference || (Number(card || 0) > 0 ? "CARD_PAYMENT" : undefined) }) });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok || !data.balanced) return setError(data.error ?? `Collection differs by ${formatCurrency(Math.abs(data.delta ?? 0))}`);
    onSaved({ ...data.collection, expectedAmount: Number(data.collection.expectedAmount), cashCollected: Number(data.collection.cashCollected), upiCollected: Number(data.collection.upiCollected) });
  }

  return (
    <BottomSheet title="Collect Payment" onClose={onClose}>
      <p className="text-sm text-slate-500">Total: <span className="font-black text-slate-900 dark:text-white">{formatCurrency(order.total)}</span></p>
      <div className="mt-4 grid gap-3">
        <label className="text-sm font-bold">
          <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Cash ₹</span>
          <input type="number" min="0" step="1" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0" className="mt-1 h-14 w-full rounded-xl border border-slate-200 px-4 text-lg font-bold dark:border-slate-700 dark:bg-slate-800" />
        </label>
        <label className="text-sm font-bold">
          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> UPI ₹</span>
          <input type="number" min="0" step="1" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="0" className="mt-1 h-14 w-full rounded-xl border border-slate-200 px-4 text-lg font-bold dark:border-slate-700 dark:bg-slate-800" />
        </label>
        <label className="text-sm font-bold">
          <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Card ₹</span>
          <input type="number" min="0" step="1" value={card} onChange={(e) => setCard(e.target.value)} placeholder="0" className="mt-1 h-14 w-full rounded-xl border border-slate-200 px-4 text-lg font-bold dark:border-slate-700 dark:bg-slate-800" />
        </label>
        {(Number(upi) > 0 || Number(card) > 0) && (
          <label className="text-sm font-bold">Reference ID
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction/Receipt no." className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-800" />
          </label>
        )}
      </div>
      {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
      <button disabled={submitting} onClick={submit} className="mt-4 h-14 w-full rounded-xl bg-blue-600 font-black text-white disabled:opacity-50">{submitting ? "Saving..." : "Confirm Collection"}</button>
    </BottomSheet>
  );
}

/* === Completion Dialog with proper Slide === */
function CompletionDialog({ order, onClose, onComplete }: { order: DeliveryOrder; onClose: () => void; onComplete: () => void }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function complete() {
    if (otp.length !== 6) return setError("Enter the 6-digit OTP from customer");
    setLoading(true);
    const res = await fetch("/api/delivery/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, otp }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setOtp(""); return setError(data.error ?? "Could not complete"); }
    onComplete();
  }

  return (
    <BottomSheet title="Complete Delivery" onClose={onClose}>
      <label className="block text-center">
        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Enter Customer OTP</span>
        <input
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          autoComplete="one-time-code"
          className="mt-3 h-16 w-full rounded-2xl border-2 border-slate-200 text-center text-3xl font-black tracking-[0.4em] outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          autoFocus
        />
      </label>
      {error && <p className="mt-3 text-center text-sm font-bold text-red-600">{error}</p>}
      <div className="mt-6">
        <SlideToConfirm
          label="Slide to deliver"
          disabled={loading || otp.length !== 6}
          onConfirm={complete}
        />
      </div>
      {loading && <p className="mt-3 text-center text-sm font-bold text-emerald-600 animate-pulse">Completing delivery...</p>}
    </BottomSheet>
  );
}

/* === Bottom Sheet === */
function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl dark:bg-slate-900"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="h-10 rounded-lg px-3 text-sm font-bold text-slate-500 active:bg-slate-100">Close</button>
        </div>
        <div className="mt-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}
