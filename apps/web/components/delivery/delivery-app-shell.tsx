"use client";

import { useState, useEffect } from "react";
import {
  Bike, CreditCard, ExternalLink,
  MapPin, Package, ShieldCheck, Truck, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { readApiResponse } from "@/lib/client-api";
import { statusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";
import { InstallAppButton } from "@/components/install-app-button";
import { SlideToConfirm } from "@/components/delivery/slide-to-confirm";
import { DeliveryOrderActions } from "@/components/delivery/delivery-order-actions";
import { LocationGate } from "@/components/delivery/location-gate";
import type { UseDeliveryLocation } from "@/components/delivery/use-delivery-location";

type DeliveryOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  total: number;
  paymentMethod: string;
  customerUnavailableWaitUntil?: string | null;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  collection?: {
    expectedAmount: number;
    cashCollected: number;
    upiCollected: number;
    upiReference: string | null;
    status: string;
  } | null;
};

type Stats = {
  todayDelivered: number;
  todayCash: number;
  todayUpi: number;
  totalDelivered: number;
  activeOrders: number;
};

interface DeliveryAppShellProps {
  partnerName: string;
  stats: Stats;
  orders: DeliveryOrder[];
}


function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function statusColor(status: string): string {
  switch (status) {
    case "READY_FOR_DELIVERY": return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "OUT_FOR_DELIVERY": return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "ARRIVING": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "CUSTOMER_UNAVAILABLE": return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "DELIVERED": return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  }
}

function navUrl(order: { latitude?: number | null; longitude?: number | null; address: string }): string {
  const { latitude, longitude, address } = order;
  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0);
  // Prefer turn-by-turn directions to the exact captured GPS point; only fall
  // back to a free-text address search when coordinates are missing/invalid.
  return hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function paymentBadge(method: string): { label: string; className: string } {
  switch (method?.toLowerCase()) {
    case "cash": return { label: "Cash", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" };
    case "upi": return { label: "UPI", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" };
    case "card": return { label: "Card", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" };
    default: return { label: method || "Wallet", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
  }
}


export function DeliveryAppShell({ partnerName, stats, orders }: DeliveryAppShellProps) {
  return (
    <LocationGate>
      {(location) => (
        <DeliveryAppShellInner partnerName={partnerName} stats={stats} orders={orders} location={location} />
      )}
    </LocationGate>
  );
}

function DeliveryAppShellInner({
  partnerName,
  stats,
  orders,
  location,
}: DeliveryAppShellProps & { location: UseDeliveryLocation }) {
  const { showToast } = useToast();
  // No more client-side relabeling of OUT_FOR_DELIVERY -> ARRIVING. Arrival is
  // now a real, GPS-verified server transition (see markArrived below) — the
  // status shown here always reflects the database.
  const [entries, setEntries] = useState<DeliveryOrder[]>(orders);
  const [loading, setLoading] = useState<string | null>(null);
  const [damageOrder, setDamageOrder] = useState<DeliveryOrder | null>(null);
  const [collectOrder, setCollectOrder] = useState<DeliveryOrder | null>(null);
  const [completeOrder, setCompleteOrder] = useState<DeliveryOrder | null>(null);
  // Seed countdowns from the server so a page refresh doesn't lose the
  // "Return to Store" wait timer for orders already CUSTOMER_UNAVAILABLE.
  const [unavailableOrders, setUnavailableOrders] = useState<Map<string, number>>(() => {
    const seeded = new Map<string, number>();
    for (const order of orders) {
      if (order.status === "CUSTOMER_UNAVAILABLE" && order.customerUnavailableWaitUntil) {
        seeded.set(order.id, new Date(order.customerUnavailableWaitUntil).getTime());
      }
    }
    return seeded;
  });
  const [tick, setTick] = useState(0);

  // Countdown tick for customer unavailable timers
  useEffect(() => {
    if (unavailableOrders.size === 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [unavailableOrders.size]);

  // tick is used implicitly to re-render countdown displays
  void tick;

  /**
   * "Mark Arrived" — the real, GPS-verified transition to ARRIVING.
   * Replaces the old fake client-only relabel that caused the DB status to
   * stay OUT_FOR_DELIVERY forever, which in turn made "Customer Unavailable"
   * silently fail (its API requires status=ARRIVING in the database).
   */
  async function markArrived(order: DeliveryOrder) {
    setLoading(order.id);
    let coords;
    try {
      coords = await location.getFreshCoords();
    } catch {
      setLoading(null);
      return showToast("Turn on location to confirm you've arrived", "error");
    }
    const response = await fetch("/api/delivery/arrive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, latitude: coords.latitude, longitude: coords.longitude }),
    });
    const data = await readApiResponse<{ error?: string; distance?: number }>(response);
    setLoading(null);
    if (!response.ok) {
      const natural =
        data.error?.includes("Too far") && data.distance
          ? `You're still ${Math.round(data.distance)}m away — get closer to the customer's location to mark arrival.`
          : data.error ?? "Could not confirm arrival";
      return showToast(natural, "error");
    }
    setEntries((current) => current.map((entry) => (entry.id === order.id ? { ...entry, status: "ARRIVING" } : entry)));
    showToast("Arrival confirmed", "success");
  }

  async function markUnavailable(order: DeliveryOrder) {
    setLoading(order.id);
    const response = await fetch("/api/delivery/unavailable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });
    const data = await readApiResponse<{ error?: string; waitUntil?: string }>(response);
    setLoading(null);
    if (!response.ok) return showToast(data.error ?? "Could not mark unavailable", "error");
    if (data.waitUntil) {
      setUnavailableOrders((prev) => new Map(prev).set(order.id, new Date(data.waitUntil!).getTime()));
    }
    setEntries((current) =>
      current.map((entry) => (entry.id === order.id ? { ...entry, status: "CUSTOMER_UNAVAILABLE" } : entry))
    );
  }

  async function returnToStore(order: DeliveryOrder) {
    setLoading(order.id);
    const response = await fetch("/api/delivery/unavailable/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });
    const data = await readApiResponse<{ error?: string }>(response);
    setLoading(null);
    if (!response.ok) return showToast(data.error ?? "Return failed", "error");
    setUnavailableOrders((prev) => {
      const next = new Map(prev);
      next.delete(order.id);
      return next;
    });
    setEntries((current) => current.filter((entry) => entry.id !== order.id));
    showToast("Order returned to store", "success");
  }


  async function handlePickup(order: DeliveryOrder) {
    setLoading(order.id);
    const response = await fetch(`/api/delivery/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "picked_up" }),
    });
    const data = await readApiResponse<{ error?: string }>(response);
    setLoading(null);
    if (!response.ok) return showToast(data.error ?? "Pickup update failed", "error");
    // Backend sets OUT_FOR_DELIVERY, not ARRIVING — "Arriving" now only
    // happens once markArrived() GPS-verifies the rider is within 100m.
    setEntries((current) =>
      current.map((entry) => (entry.id === order.id ? { ...entry, status: "OUT_FOR_DELIVERY" } : entry))
    );
    showToast("Order picked up — on the way!", "success");
  }

  return (
    <div className="mx-auto max-w-lg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-br from-emerald-600 to-emerald-700 px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] shadow-lg shadow-emerald-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Bike className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white/70">{getGreeting()}</p>
            <h1 className="text-lg font-black text-white">{partnerName}</h1>
          </div>
          <Zap className="h-5 w-5 text-emerald-200" />
        </div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
            <p className="text-micro font-bold text-white/70">Today</p>
            <p className="text-lg font-black text-white">{stats.todayDelivered}</p>
            <p className="text-micro text-white/60">deliveries</p>
          </div>
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
            <p className="text-micro font-bold text-white/70">Collected</p>
            <p className="text-lg font-black text-white">{formatCurrency(stats.todayCash + stats.todayUpi)}</p>
            <p className="text-micro text-white/60">cash + upi</p>
          </div>
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
            <p className="text-micro font-bold text-white/70">Lifetime</p>
            <p className="text-lg font-black text-white">{stats.totalDelivered}</p>
            <p className="text-micro text-white/60">total</p>
          </div>
        </div>
      </header>


      {/* Active Orders Section */}
      <section className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Active Orders</h2>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {entries.length}
            </span>
          </div>
          <InstallAppButton compact />
        </div>

        {/* Order Cards */}
        <div className="mt-4 space-y-4">
          <AnimatePresence initial={false}>
            {entries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 p-10 dark:border-slate-700"
              >
                <Package className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 font-black text-slate-700 dark:text-slate-300">No active orders</p>
                <p className="mt-1 text-sm text-slate-500">New assignments appear instantly</p>
              </motion.div>
            ) : (
              entries.map((order) => {
                const payment = paymentBadge(order.paymentMethod);
                return (
                  <motion.article
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Order Header */}
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">
                            #{order.orderNumber}
                          </h3>
                          <span className={`rounded-full px-2 py-0.5 text-micro font-black ${statusColor(order.status)}`}>
                            {statusLabels[order.status as keyof typeof statusLabels] ?? order.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 dark:text-white">{formatCurrency(order.total)}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-micro font-bold ${payment.className}`}>
                          {payment.label}
                        </span>
                      </div>
                    </div>


                    {/* Address */}
                    <div className="px-4">
                      <button
                        onClick={() => window.open(navUrl(order), "_blank")}
                        className="flex w-full items-start gap-2 rounded-xl bg-slate-50 p-3 text-left dark:bg-slate-800"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{order.address}</span>
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>

                    {/* Expandable Items */}
                    <details className="mx-4 mt-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <summary className="cursor-pointer px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} in order
                      </summary>
                      <div className="divide-y divide-slate-100 px-3 dark:divide-slate-800">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between py-2 text-sm">
                            <span className="text-slate-700 dark:text-slate-300">
                              {item.name} × {item.quantity}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>


                    {/* Action Buttons */}
                    <DeliveryOrderActions
                      order={order}
                      loading={loading}
                      unavailableOrders={unavailableOrders}
                      onPickup={handlePickup}
                      onMarkArrived={markArrived}
                      onMarkUnavailable={markUnavailable}
                      onReturnToStore={returnToStore}
                      onOpenDamage={setDamageOrder}
                      onOpenCollect={setCollectOrder}
                      onOpenComplete={setCompleteOrder}
                    />
                  </motion.article>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </section>


      {/* Dialogs */}
      <AnimatePresence>
        {damageOrder && (
          <DamageDialog
            order={damageOrder}
            onClose={() => setDamageOrder(null)}
            onSaved={() => showToast("Damage adjustment recorded", "success")}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {collectOrder && (
          <CollectionDialog
            order={collectOrder}
            onClose={() => setCollectOrder(null)}
            onSaved={(collection) => {
              setEntries((current) =>
                current.map((entry) =>
                  entry.id === collectOrder.id ? { ...entry, collection } : entry
                )
              );
              setCollectOrder(null);
              showToast("Payment collected", "success");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {completeOrder && (
          <CompletionDialog
            order={completeOrder}
            onClose={() => setCompleteOrder(null)}
            onComplete={() => {
              setEntries((current) => current.filter((entry) => entry.id !== completeOrder.id));
              setCompleteOrder(null);
              if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
              showToast("Delivery completed!", "success");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


/* ─── BottomSheet Helper ─── */
function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        {/* Drag Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="h-10 rounded-xl px-3 text-sm font-bold text-slate-500 dark:text-slate-400"
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}


/* ─── DamageDialog ─── */
function DamageDialog({
  order,
  onClose,
  onSaved,
}: {
  order: DeliveryOrder;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [itemId, setItemId] = useState(order.items[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/evidence/upload", { method: "POST", body });
    const data = await response.json();
    if (response.ok) setEvidenceUrl(data.url);
    else setError(data.error ?? "Upload failed");
  }

  async function submit() {
    setLoading(true);
    const response = await fetch("/api/delivery/damage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        orderItemId: itemId,
        quantity,
        reason,
        reductionAmount: Number(amount),
        evidenceUrl: evidenceUrl || undefined,
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "Adjustment failed");
    onSaved();
    onClose();
  }


  return (
    <BottomSheet title="Doorstep Damage" onClose={onClose}>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
        Item
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="mt-2 h-14 w-full rounded-xl border border-slate-200 bg-white px-3 text-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {order.items.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Quantity
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-2 h-14 w-full rounded-xl border border-slate-200 px-3 text-lg dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Reduction ₹
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 h-14 w-full rounded-xl border border-slate-200 px-3 text-lg dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
      </div>

      <label className="mt-3 block text-sm font-bold text-slate-700 dark:text-slate-300">
        Reason
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-800"
        />
      </label>

      <label className="mt-3 block text-sm font-bold text-slate-700 dark:text-slate-300">
        Evidence photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => upload(e.target.files?.[0])}
          className="mt-2 block w-full text-sm"
        />
      </label>

      {evidenceUrl && (
        <p className="mt-2 text-xs font-bold text-emerald-700">Photo uploaded</p>
      )}
      {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}

      <button
        disabled={loading}
        onClick={submit}
        className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-black text-white disabled:opacity-40"
      >
        {loading ? "Saving…" : "Save Adjustment"}
      </button>
    </BottomSheet>
  );
}


/* ─── CollectionDialog ─── */
function CollectionDialog({
  order,
  onClose,
  onSaved,
}: {
  order: DeliveryOrder;
  onClose: () => void;
  onSaved: (collection: NonNullable<DeliveryOrder["collection"]>) => void;
}) {
  const expectedAmount = order.collection?.expectedAmount ?? order.total;
  const [cash, setCash] = useState("");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalEntered = Number(cash || 0) + Number(upi || 0) + Number(card || 0);
  const difference = Number((totalEntered - expectedAmount).toFixed(2));
  const hasEntry = Boolean(cash || upi || card);

  // Natural-language guidance so the rider always knows what to do next.
  const balance: { text: string; className: string } | null = !hasEntry
    ? null
    : Math.abs(difference) < 0.01
      ? {
          text: "Perfect — exact amount, no change needed.",
          className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        }
      : difference > 0
        ? {
            text: `Return ${formatCurrency(difference)} change to the customer.`,
            className: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
          }
        : {
            text: `Collect ${formatCurrency(Math.abs(difference))} more from the customer.`,
            className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
          };

  async function submit() {
    setLoading(true);
    const response = await fetch("/api/delivery/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        cashCollected: Number(cash || 0),
        upiCollected: Number(upi || 0) + Number(card || 0),
        upiReference: reference || undefined,
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok || !data.balanced) {
      const delta = Math.abs(Number(data.delta ?? difference));
      const natural =
        (data.delta ?? difference) < 0
          ? `Still ${formatCurrency(delta)} short — collect the full ${formatCurrency(expectedAmount)}.`
          : `That's ${formatCurrency(delta)} over — the total should be ${formatCurrency(expectedAmount)}.`;
      return setError(data.error ?? natural);
    }
    onSaved({
      ...data.collection,
      expectedAmount: Number(data.collection.expectedAmount),
      cashCollected: Number(data.collection.cashCollected),
      upiCollected: Number(data.collection.upiCollected),
    });
  }

  const inputClass =
    "mt-2 h-14 w-full rounded-xl border border-slate-200 px-3 text-lg dark:border-slate-700 dark:bg-slate-800";

  return (
    <BottomSheet title="Record Collection" onClose={onClose}>
      {/* Amount to collect — the rider's headline number */}
      <div className="rounded-2xl bg-slate-900 p-4 text-center dark:bg-white">
        <p className="text-micro font-bold uppercase tracking-wide text-white/60 dark:text-slate-500">
          Amount to collect
        </p>
        <p className="mt-1 text-4xl font-black text-white dark:text-slate-900">
          {formatCurrency(expectedAmount)}
        </p>
        <p className="mt-1 text-xs font-bold text-white/60 dark:text-slate-500">
          #{order.orderNumber} · {(order.paymentMethod || "COD").toUpperCase()}
        </p>
      </div>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Enter what you actually received. It should add up to the amount above.
      </p>

      {/* Quick fill: most COD orders are paid fully in cash */}
      <button
        type="button"
        onClick={() => { setCash(String(expectedAmount)); setUpi(""); setCard(""); }}
        className="mt-3 h-10 w-full rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      >
        Received full {formatCurrency(expectedAmount)} in cash
      </button>

      <div className="mt-4 space-y-3">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          Cash ₹
          <input type="number" min="0" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0" className={inputClass} />
        </label>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          UPI ₹
          <input type="number" min="0" step="0.01" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="0" className={inputClass} />
        </label>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          Card ₹
          <input type="number" min="0" step="0.01" value={card} onChange={(e) => setCard(e.target.value)} placeholder="0" className={inputClass} />
        </label>
      </div>

      {/* Running total entered so far */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm dark:bg-slate-800">
        <span className="font-bold text-slate-500 dark:text-slate-400">Entered so far</span>
        <span className="font-black text-slate-900 dark:text-white">{formatCurrency(totalEntered)}</span>
      </div>

      {(Number(upi) > 0 || Number(card) > 0) && (
        <label className="mt-3 block text-sm font-bold text-slate-700 dark:text-slate-300">
          Reference ID
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction reference" className={inputClass} />
        </label>
      )}

      {/* Live natural-language guidance */}
      {balance && (
        <div className={`mt-3 rounded-xl px-3 py-3 text-center text-sm font-bold ${balance.className}`}>
          {balance.text}
        </div>
      )}

      {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}

      <button
        disabled={loading}
        onClick={submit}
        className="mt-4 h-12 w-full rounded-xl bg-blue-600 font-black text-white disabled:opacity-40"
      >
        {loading ? "Saving…" : "Save Collection"}
      </button>
    </BottomSheet>
  );
}


/* ─── CompletionDialog ─── */
function CompletionDialog({
  order,
  onClose,
  onComplete,
}: {
  order: DeliveryOrder;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function complete() {
    setLoading(true);
    const response = await fetch("/api/delivery/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, otp }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      return setError(data.error ?? "Delivery could not be completed");
    }
    onComplete();
  }

  return (
    <BottomSheet title="Complete Delivery" onClose={onClose}>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
        Customer OTP
        <input
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••••"
          className="mt-2 h-16 w-full rounded-2xl border border-slate-200 text-center text-3xl font-black tracking-[0.4em] dark:border-slate-700 dark:bg-slate-800"
        />
      </label>

      {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}

      <div className="mt-5">
        <SlideToConfirm
          label="Slide to deliver"
          disabled={loading || otp.length !== 6}
          onConfirm={complete}
        />
      </div>
    </BottomSheet>
  );
}
