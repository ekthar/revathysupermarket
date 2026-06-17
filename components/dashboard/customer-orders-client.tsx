"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, Navigation, RefreshCcw, RotateCcw, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { orderStatuses, statusLabels } from "@/lib/constants";
import { readApiResponse } from "@/lib/client-api";
import { cn, formatCurrency } from "@/lib/utils";
import { DeliveryOtpCard } from "@/components/dashboard/delivery-otp-card";
import { OrderTrackingMap } from "@/components/dashboard/order-tracking-map";
import { useCart } from "@/components/cart/cart-provider";
import type { Product } from "@/lib/types";

const enableSseTracking = process.env.NEXT_PUBLIC_ENABLE_SSE_TRACKING === "true";

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
  deliveryPartnerLocation?: { latitude: number; longitude: number; updatedAt?: string } | null;
  items: Array<{ id: string; name: string; quantity: number; price: number; product?: Product | null }>;
  editLogs: Array<{
    id: string;
    action: string;
    originalItem: unknown;
    newItem: unknown;
    priceDelta: number;
    reason?: string | null;
    createdAt: string;
  }>;
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

type EditItemSnapshot = {
  name: string;
  quantity: number;
  price: number;
};

function readEditItem(value: unknown): EditItemSnapshot {
  const item = value as Partial<EditItemSnapshot> | null | undefined;
  return {
    name: String(item?.name ?? "Item"),
    quantity: Number(item?.quantity ?? 0),
    price: Number(item?.price ?? 0)
  };
}

function editActionLabel(action: string) {
  if (action === "remove") return "Removed";
  if (action === "substitute") return "Substituted";
  if (action === "quantity-change") return "Quantity changed";
  return "Updated";
}

export function CustomerOrdersClient({ initialOrders }: { initialOrders: CustomerOrder[] }) {
  const { addItems } = useCart();
  const [orders, setOrders] = useState(initialOrders);
  const [liveOrders, setLiveOrders] = useState<Record<string, LiveOrderState>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const activeStreamOrders = useMemo(
    () => enableSseTracking ? orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)) : [],
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
    if (!enableSseTracking) return;
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
      const refresh = await fetch("/api/orders", { cache: "no-store" });
      const data = await readApiResponse<{ orders?: CustomerOrder[] }>(refresh);
      if (refresh.ok && data.orders) {
        setOrders(data.orders);
      } else {
        setOrders((current) => current.map((order) => order.id === orderId ? {
          ...order,
          status: decision === "approved" ? "ACCEPTED" : "ORDER_RECEIVED",
          editApprovalStatus: decision,
          editLogs: []
        } : order));
      }
      return;
    }
    const data = await readApiResponse<{ error?: string }>(response);
    window.alert(data.error ?? "Approval update failed.");
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

  function reorder(order: CustomerOrder) {
    const products = order.items
      .filter((item) => item.product && item.quantity > 0)
      .map((item) => ({ ...item.product!, quantity: item.quantity }));
    if (products.length === 0) {
      window.alert("Products from this order are no longer available for reorder.");
      return;
    }
    addItems(products);
    window.location.href = "/cart";
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
          const visibleItems = order.items.filter((item) => item.quantity > 0);
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
                  <p className="text-sm text-muted-foreground">{visibleItems.length} items</p>
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
                <OrderEditApprovalCard order={order} onDecision={(decision) => decideEdit(order.id, decision)} />
              ) : null}
              <OrderItemsSummary items={visibleItems} />
              {order.status === "DELIVERED" ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => reorder(order)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-white">
                    <RotateCcw className="h-4 w-4" />
                    Reorder
                  </button>
                  <button onClick={() => requestReturn(order)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-4 text-sm font-black">
                    <RotateCcw className="h-4 w-4 text-primary" />
                    Request return
                  </button>
                </div>
              ) : null}
              <LiveTrackingPanel order={order} live={liveOrders[order.id]} />
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function OrderEditApprovalCard({
  order,
  onDecision
}: {
  order: CustomerOrder;
  onDecision: (decision: "approved" | "rejected") => void;
}) {
  const totalDelta = order.editLogs.reduce((sum, log) => sum + log.priceDelta, 0);
  const oldTotal = order.total - totalDelta;

  return (
    <div className="mt-5 rounded-[1.5rem] bg-amber-50 p-4 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black">Order edit needs your approval</p>
          <p className="mt-1 text-sm">Please review the supermarket changes before packing starts.</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 text-right text-slate-900 dark:bg-white/10 dark:text-white">
          <p className="text-xs font-black uppercase text-muted-foreground">Total change</p>
          <p className={cn("mt-1 text-xl font-black", totalDelta >= 0 ? "text-amber-700 dark:text-amber-100" : "text-primary")}>
            {totalDelta >= 0 ? "+" : ""}{formatCurrency(totalDelta)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {order.editLogs.length === 0 ? (
          <div className="rounded-2xl bg-white/70 p-3 text-sm font-bold text-slate-800 dark:bg-white/10 dark:text-white">
            Edit details are loading. Please refresh if this stays blank.
          </div>
        ) : order.editLogs.map((log) => {
          const original = readEditItem(log.originalItem);
          const updated = readEditItem(log.newItem);
          const originalAmount = original.price * original.quantity;
          const updatedAmount = updated.price * updated.quantity;
          return (
            <article key={log.id} className="rounded-2xl bg-white/80 p-3 text-slate-900 dark:bg-white/10 dark:text-white">
              <div className="flex flex-wrap justify-between gap-3">
                <p className="text-sm font-black">{editActionLabel(log.action)}</p>
                <p className={cn("text-sm font-black", log.priceDelta >= 0 ? "text-amber-700 dark:text-amber-100" : "text-primary")}>
                  {log.priceDelta >= 0 ? "+" : ""}{formatCurrency(log.priceDelta)}
                </p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-amber-100/70 p-3 dark:bg-black/15">
                  <p className="text-xs font-black uppercase text-muted-foreground">Original item</p>
                  <p className="mt-1 font-bold">{original.name}</p>
                  <p className="mt-1 text-sm">{original.quantity} x {formatCurrency(original.price)} = {formatCurrency(originalAmount)}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <p className="text-xs font-black uppercase text-muted-foreground">Updated item</p>
                  <p className="mt-1 font-bold">{updated.quantity === 0 ? "Removed from order" : updated.name}</p>
                  <p className="mt-1 text-sm">{updated.quantity} x {formatCurrency(updated.price)} = {formatCurrency(updatedAmount)}</p>
                </div>
              </div>
              {log.reason ? <p className="mt-2 text-sm"><span className="font-black">Reason:</span> {log.reason}</p> : null}
            </article>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl bg-white/70 p-3 text-slate-900 dark:bg-white/10 dark:text-white sm:grid-cols-3">
        <div>
          <p className="text-xs font-black uppercase text-muted-foreground">Old total</p>
          <p className="mt-1 font-black">{formatCurrency(oldTotal)}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase text-muted-foreground">New total</p>
          <p className="mt-1 font-black">{formatCurrency(order.total)}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase text-muted-foreground">Decision needed</p>
          <p className="mt-1 font-black">Approve or reject</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => onDecision("approved")} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black text-white">
          <CheckCircle2 className="h-4 w-4" />
          Approve changes
        </button>
        <button onClick={() => onDecision("rejected")} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 text-xs font-black text-white">
          <XCircle className="h-4 w-4" />
          Reject changes
        </button>
      </div>
    </div>
  );
}

function OrderItemsSummary({ items }: { items: CustomerOrder["items"] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-5 rounded-[1.5rem] border border-border bg-background/70 p-4">
      <p className="text-xs font-black uppercase text-muted-foreground">Current order details</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 rounded-2xl bg-muted p-3 text-sm">
            <span className="font-bold">{item.name} x {item.quantity}</span>
            <span className="font-black">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveTrackingPanel({ order, live }: { order: CustomerOrder; live?: LiveOrderState }) {
  const rider = live?.deliveryPartnerLocation ?? order.deliveryPartnerLocation;
  if (["DELIVERED", "CANCELLED"].includes(order.status) && !rider) return null;

  const destination = { latitude: order.latitude, longitude: order.longitude };
  const distance = rider ? distanceKm(rider, destination) : null;
  const etaMinutes = distance !== null ? Math.max(2, Math.ceil((distance / 18) * 60)) : null;
  const directionsUrl = rider
    ? `https://www.google.com/maps/dir/?api=1&origin=${rider.latitude},${rider.longitude}&destination=${order.latitude},${order.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`;

  return (
    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-background/70">
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {order.deliveryOtp && !order.deliveryOtp.includes("*") && ["OUT_FOR_DELIVERY", "READY_FOR_DELIVERY"].includes(order.status) ? <DeliveryOtpCard otp={order.deliveryOtp} /> : null}
        <div className="rounded-2xl bg-muted p-3">
          <p className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground"><Navigation className="h-4 w-4 text-primary" />Live tracking</p>
          <p className="mt-1 font-black">{rider ? "Rider location active" : "Waiting for rider location"}</p>
          {etaMinutes !== null ? <p className="mt-1 text-sm text-muted-foreground">Approx ETA {etaMinutes} min - {distance?.toFixed(2)} km away</p> : null}
        </div>
      </div>
      <OrderTrackingMap
        title={`Live delivery map for ${order.orderNumber}`}
        latitude={rider?.latitude ?? order.latitude}
        longitude={rider?.longitude ?? order.longitude}
      />
      <a href={directionsUrl} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 bg-primary text-sm font-black text-white">
        <MapPin className="h-4 w-4" />
        Open map
      </a>
    </div>
  );
}
