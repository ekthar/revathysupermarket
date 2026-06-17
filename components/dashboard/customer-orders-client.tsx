"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, Navigation, RefreshCcw, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { orderStatuses, statusLabels } from "@/lib/constants";
import { readApiResponse } from "@/lib/client-api";
import { cn, formatCurrency } from "@/lib/utils";

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: keyof typeof statusLabels;
  editApprovalStatus?: string | null;
  deliveryOtp?: string | null;
  latitude: number;
  longitude: number;
  total: number;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
};
type LiveOrderState = {
  status?: keyof typeof statusLabels;
  deliveryPartnerLocation?: { latitude: number; longitude: number; updatedAt?: string } | null;
};

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const radius = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function CustomerOrdersClient({ initialOrders }: { initialOrders: CustomerOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [liveOrders, setLiveOrders] = useState<Record<string, LiveOrderState>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const activeStreamOrders = useMemo(
    () => orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)),
    [orders]
  );

  useEffect(() => {
    let active = true;

    async function refresh() {
      setIsRefreshing(true);
      const response = await fetch("/api/orders", { cache: "no-store" });
      const data = await readApiResponse<{ orders?: CustomerOrder[] }>(response);
      if (!active) return;
      if (response.ok && data.orders) {
        setOrders(data.orders);
        setLastUpdated(new Date());
      }
      setIsRefreshing(false);
    }

    const interval = window.setInterval(refresh, 8000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const sources = activeStreamOrders
      .map((order) => {
        const source = new EventSource(`/api/orders/${order.id}/stream`);
        source.onmessage = (event) => {
          const data = JSON.parse(event.data) as LiveOrderState;
          setLiveOrders((current) => ({ ...current, [order.id]: data }));
          if (data.status) {
            setOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, status: data.status! } : entry));
          }
        };
        source.onerror = () => source.close();
        return source;
      });
    return () => sources.forEach((source) => source.close());
  }, [activeStreamOrders]);

  async function decideEdit(orderId: string, decision: "approved" | "rejected") {
    const response = await fetch(`/api/orders/${orderId}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision })
    });
    if (response.ok) {
      setOrders((current) => current.map((order) => order.id === orderId ? {
        ...order,
        status: decision === "approved" ? "ACCEPTED" : "ORDER_RECEIVED",
        editApprovalStatus: decision
      } : order));
    }
  }

  async function requestReturn(order: CustomerOrder) {
    const reason = window.prompt("Return reason: wrong_item, damaged, quality_issue, changed_mind, other", "quality_issue");
    if (!reason) return;
    const response = await fetch(`/api/orders/${order.id}/returns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason,
        items: order.items.map((item) => ({ orderItemId: item.id, quantity: item.quantity })),
        note: "Requested from customer dashboard"
      })
    });
    if (response.ok) window.alert("Return request submitted.");
  }

  if (orders.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-border p-10 text-center">
        <h2 className="font-display text-2xl font-bold">No orders yet</h2>
        <p className="mt-2 text-muted-foreground">Your grocery orders will appear here.</p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6">
      <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-xs font-bold text-muted-foreground">
        <span>{lastUpdated ? "Last updated just now" : "Live tracking updates every 8 seconds"}</span>
        <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin text-primary")} />
      </div>
      <AnimatePresence initial={false}>
        {orders.map((order) => {
          const cancelled = order.status === "CANCELLED";
          const activeIndex = orderStatuses.indexOf(order.status);
          return (
            <motion.article
              key={order.id}
              layout
              initial={{ opacity: 0, y: 18 }}
              animate={cancelled ? { opacity: 1, y: 0, x: [0, -3, 3, 0] } : { opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={cn(
                "rounded-[1.75rem] border bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5",
                cancelled ? "border-red-200 bg-red-50/90 dark:border-red-500/30 dark:bg-red-950/25" : "border-white/70"
              )}
            >
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold">Order #{order.orderNumber}</h2>
                  <p className="text-sm text-muted-foreground">{order.items.length} items</p>
                </div>
                <div className="text-right">
                  <p className="font-black">{formatCurrency(order.total)}</p>
                  <p className={cn("mt-1 rounded-full px-3 py-1 text-xs font-black", cancelled ? "bg-red-600 text-white" : "bg-primary/10 text-primary")}>
                    {statusLabels[order.status]}
                  </p>
                </div>
              </div>
              {cancelled ? (
                <div className="mt-6 flex gap-3 rounded-2xl bg-red-100 p-4 text-red-700 dark:bg-red-500/10 dark:text-red-200">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-black">This order was cancelled</p>
                    <p className="mt-1 text-sm">Please contact Revathy Supermarket if you need help placing it again.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid gap-3 md:grid-cols-6">
                  {orderStatuses.filter((status) => status !== "CANCELLED").map((status, index) => (
                    <motion.div key={status} layout className="flex items-center gap-3 md:block">
                      <span className={index <= activeIndex ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-black text-white" : "flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-black"}>
                        {index + 1}
                      </span>
                      <p className="mt-0 text-xs font-bold md:mt-2">{statusLabels[status]}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              {order.status === "AWAITING_CUSTOMER_APPROVAL" ? (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="font-black">Order edit needs your approval</p>
                  <p className="mt-1 text-sm">The store updated one or more items before packing.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => decideEdit(order.id, "approved")} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black text-white"><CheckCircle2 className="h-4 w-4" />Approve</button>
                    <button onClick={() => decideEdit(order.id, "rejected")} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 text-xs font-black text-white"><XCircle className="h-4 w-4" />Reject</button>
                  </div>
                </div>
              ) : null}
              {order.status === "DELIVERED" ? (
                <button onClick={() => requestReturn(order)} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-4 text-sm font-black">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  Request return
                </button>
              ) : null}
              <LiveTrackingPanel order={order} live={liveOrders[order.id]} />
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function LiveTrackingPanel({ order, live }: { order: CustomerOrder; live?: LiveOrderState }) {
  const rider = live?.deliveryPartnerLocation;
  if (["DELIVERED", "CANCELLED"].includes(order.status) && !rider) return null;

  const destination = { latitude: order.latitude, longitude: order.longitude };
  const distance = rider ? distanceKm(rider, destination) : null;
  const etaMinutes = distance !== null ? Math.max(2, Math.ceil((distance / 18) * 60)) : null;
  const mapUrl = rider
    ? `https://www.google.com/maps?q=${rider.latitude},${rider.longitude}&z=15&output=embed`
    : `https://www.google.com/maps?q=${order.latitude},${order.longitude}&z=15&output=embed`;
  const directionsUrl = rider
    ? `https://www.google.com/maps/dir/?api=1&origin=${rider.latitude},${rider.longitude}&destination=${order.latitude},${order.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`;

  return (
    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-background/70">
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {order.deliveryOtp && !order.deliveryOtp.includes("*") ? (
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <p className="flex items-center gap-2 text-xs font-black uppercase"><ShieldCheck className="h-4 w-4" />Delivery OTP</p>
            <p className="mt-1 text-2xl font-black tracking-[0.2em]">{order.deliveryOtp}</p>
            <p className="mt-1 text-xs font-bold">Share this with the rider only at handover.</p>
          </div>
        ) : null}
        <div className="rounded-2xl bg-muted p-3">
          <p className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground"><Navigation className="h-4 w-4 text-primary" />Live tracking</p>
          <p className="mt-1 font-black">{rider ? "Rider location active" : "Waiting for rider location"}</p>
          {etaMinutes !== null ? <p className="mt-1 text-sm text-muted-foreground">Approx ETA {etaMinutes} min · {distance?.toFixed(2)} km away</p> : null}
        </div>
      </div>
      <iframe
        title={`Live delivery map for ${order.orderNumber}`}
        src={mapUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-64 w-full border-0"
      />
      <a href={directionsUrl} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 bg-primary text-sm font-black text-white">
        <MapPin className="h-4 w-4" />
        Open map
      </a>
    </div>
  );
}
