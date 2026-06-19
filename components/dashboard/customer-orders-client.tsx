"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, MapPin, Navigation, Package, RefreshCcw, RotateCcw, XCircle } from "lucide-react";
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
  updatedAt?: string;
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

type EditItemSnapshot = { name: string; quantity: number; price: number };

function readEditItem(value: unknown): EditItemSnapshot {
  const item = value as Partial<EditItemSnapshot> | null | undefined;
  return { name: String(item?.name ?? "Item"), quantity: Number(item?.quantity ?? 0), price: Number(item?.price ?? 0) };
}

function editActionLabel(action: string) {
  if (action === "remove") return "Removed";
  if (action === "substitute") return "Substituted";
  if (action === "quantity-change") return "Qty changed";
  return "Updated";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function CustomerOrdersClient({ initialOrders }: { initialOrders: CustomerOrder[] }) {
  const { addItems } = useCart();
  const [orders, setOrders] = useState(initialOrders);
  const [liveOrders, setLiveOrders] = useState<Record<string, LiveOrderState>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Swiggy-style: delivered/cancelled orders are collapsed by default
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const active = new Set<string>();
    for (const order of initialOrders) {
      if (!["DELIVERED", "CANCELLED"].includes(order.status)) {
        active.add(order.id);
      }
    }
    return active;
  });

  const activeStreamOrders = useMemo(
    () => enableSseTracking ? orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)) : [],
    [orders]
  );

  function toggleExpand(orderId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

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
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!enableSseTracking) return;
    const sources = activeStreamOrders.map((order) => {
      const source = new EventSource(`/api/orders/${order.id}/stream`);
      source.onmessage = (event) => {
        const data = JSON.parse(event.data) as LiveOrderState;
        setLiveOrders((current) => ({ ...current, [order.id]: data }));
        if (data.status) setOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, status: data.status! } : entry));
      };
      source.onerror = () => source.close();
      return source;
    });
    return () => sources.forEach((source) => source.close());
  }, [activeStreamOrders]);

  async function decideEdit(orderId: string, decision: "approved" | "rejected") {
    const response = await fetch(`/api/orders/${orderId}/approval`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) });
    if (response.ok) {
      const refresh = await fetch("/api/orders", { cache: "no-store" });
      const data = await readApiResponse<{ orders?: CustomerOrder[] }>(refresh);
      if (refresh.ok && data.orders) setOrders(data.orders);
      return;
    }
    const data = await readApiResponse<{ error?: string }>(response);
    window.alert(data.error ?? "Approval update failed.");
  }

  async function requestReturn(order: CustomerOrder) {
    const reason = window.prompt("Return reason: wrong_item, damaged, quality_issue, changed_mind, other", "quality_issue");
    if (!reason) return;
    const response = await fetch(`/api/orders/${order.id}/returns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, items: order.items.map((item) => ({ orderItemId: item.id, quantity: item.quantity })), note: "Requested from customer dashboard" }) });
    if (response.ok) window.alert("Return request submitted.");
  }

  function reorder(order: CustomerOrder) {
    const products = order.items.filter((item) => item.product && item.quantity > 0 && item.product.stock > 0).map((item) => ({ ...item.product!, quantity: item.quantity }));
    if (products.length === 0) { window.alert("Products from this order are no longer available."); return; }
    addItems(products);
    window.location.href = "/cart";
  }

  if (orders.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-border p-10 text-center">
        <Package className="h-12 w-12 mx-auto text-slate-300" />
        <h2 className="mt-4 font-display text-xl font-bold">No orders yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your grocery orders will appear here.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
        <span>{lastUpdated ? "Updated just now" : "Live updates every 8s"}</span>
        <RefreshCcw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-primary")} />
      </div>

      {/* Orders list */}
      <AnimatePresence initial={false}>
        {orders.map((order) => {
          const isExpanded = expandedIds.has(order.id);
          const cancelled = order.status === "CANCELLED";
          const delivered = order.status === "DELIVERED";
          const isComplete = delivered || cancelled;
          const activeIndex = orderStatuses.indexOf(order.status);
          const visibleItems = order.items.filter((item) => item.quantity > 0);
          const itemNames = visibleItems.slice(0, 3).map((i) => i.name).join(", ");
          const moreCount = visibleItems.length - 3;

          return (
            <motion.article
              key={order.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={cn(
                "rounded-2xl border bg-white overflow-hidden transition-shadow",
                cancelled ? "border-red-200" : "border-slate-100",
                isExpanded && "shadow-md"
              )}
            >
              {/* Collapsed header - always visible (tap to toggle) */}
              <button
                type="button"
                onClick={() => toggleExpand(order.id)}
                className="w-full text-left px-4 py-3.5 flex items-center gap-3"
              >
                {/* Status icon */}
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  cancelled ? "bg-red-100" : delivered ? "bg-green-100" : "bg-primary/10"
                )}>
                  {cancelled ? <XCircle className="h-5 w-5 text-red-600" /> :
                   delivered ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                   <Package className="h-5 w-5 text-primary" />}
                </div>

                {/* Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-bold text-slate-900">Order #{order.orderNumber}</p>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      cancelled ? "bg-red-100 text-red-700" :
                      delivered ? "bg-green-100 text-green-700" :
                      "bg-primary/10 text-primary"
                    )}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {itemNames}{moreCount > 0 ? ` +${moreCount} more` : ""}
                  </p>
                </div>

                {/* Price + date + chevron */}
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{formatCurrency(order.total)}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </motion.div>
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                      {/* Status timeline - compact */}
                      {!cancelled && (
                        <div className="flex items-center gap-1 mb-4 overflow-x-auto no-scrollbar pb-1">
                          {orderStatuses.filter((s) => s !== "CANCELLED").map((status, index) => (
                            <div key={status} className="flex items-center">
                              <div className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                                index <= activeIndex ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                              )}>
                                {index < activeIndex ? "✓" : index + 1}
                              </div>
                              {index < orderStatuses.length - 2 && (
                                <div className={cn("h-[2px] w-4 sm:w-6", index < activeIndex ? "bg-primary" : "bg-slate-100")} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {cancelled && (
                        <div className="flex gap-2 rounded-xl bg-red-50 p-3 text-red-700 mb-4">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p className="text-[12px] font-semibold">This order was cancelled. Contact us for help.</p>
                        </div>
                      )}

                      {/* Edit approval */}
                      {order.status === "AWAITING_CUSTOMER_APPROVAL" && (
                        <OrderEditApprovalCard order={order} onDecision={(d) => decideEdit(order.id, d)} />
                      )}

                      {/* Items list - compact */}
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Items</p>
                        <div className="space-y-1.5">
                          {visibleItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-[12px]">
                              <span className="text-slate-700">{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                              <span className="font-semibold text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[12px]">
                          <span className="font-bold text-slate-900">Total</span>
                          <span className="font-bold text-slate-900">{formatCurrency(order.total)}</span>
                        </div>
                      </div>

                      {/* Actions for delivered orders */}
                      {delivered && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => reorder(order)} className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-[11px] font-bold text-white">
                            <RotateCcw className="h-3.5 w-3.5" /> Reorder
                          </button>
                          <button onClick={() => requestReturn(order)} className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700">
                            <RotateCcw className="h-3.5 w-3.5" /> Return
                          </button>
                        </div>
                      )}

                      {/* Live tracking for active orders */}
                      {!isComplete && <LiveTrackingPanel order={order} live={liveOrders[order.id]} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function OrderEditApprovalCard({ order, onDecision }: { order: CustomerOrder; onDecision: (decision: "approved" | "rejected") => void }) {
  const totalDelta = order.editLogs.reduce((sum, log) => sum + log.priceDelta, 0);
  return (
    <div className="rounded-xl bg-amber-50 p-3 mb-4">
      <p className="text-[12px] font-bold text-amber-800">Order edit needs your approval</p>
      <div className="mt-2 space-y-1.5">
        {order.editLogs.map((log) => {
          const original = readEditItem(log.originalItem);
          const updated = readEditItem(log.newItem);
          return (
            <div key={log.id} className="flex justify-between text-[11px] bg-white/70 rounded-lg p-2">
              <span className="text-slate-700">{editActionLabel(log.action)}: {original.name}</span>
              <span className={cn("font-bold", log.priceDelta >= 0 ? "text-amber-700" : "text-green-700")}>
                {log.priceDelta >= 0 ? "+" : ""}{formatCurrency(log.priceDelta)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => onDecision("approved")} className="h-9 rounded-xl bg-primary text-[11px] font-bold text-white flex items-center justify-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
        </button>
        <button onClick={() => onDecision("rejected")} className="h-9 rounded-xl bg-red-600 text-[11px] font-bold text-white flex items-center justify-center gap-1">
          <XCircle className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}

function LiveTrackingPanel({ order, live }: { order: CustomerOrder; live?: LiveOrderState }) {
  const rider = live?.deliveryPartnerLocation ?? order.deliveryPartnerLocation;
  if (!rider && !["OUT_FOR_DELIVERY", "READY_FOR_DELIVERY"].includes(order.status)) return null;

  const destination = { latitude: order.latitude, longitude: order.longitude };
  const distance = rider ? distanceKm(rider, destination) : null;
  const etaMinutes = distance !== null ? Math.max(2, Math.ceil((distance / 18) * 60)) : null;

  return (
    <div className="mt-3 rounded-xl border border-slate-100 overflow-hidden">
      <div className="p-3 space-y-2">
        {order.deliveryOtp && !order.deliveryOtp.includes("*") && ["OUT_FOR_DELIVERY", "READY_FOR_DELIVERY"].includes(order.status) && (
          <DeliveryOtpCard otp={order.deliveryOtp} />
        )}
        <div className="flex items-center gap-2 text-[11px]">
          <Navigation className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-slate-700">
            {rider ? `Rider ${distance?.toFixed(1)} km away` : "Waiting for rider"} 
            {etaMinutes ? ` • ~${etaMinutes} min` : ""}
          </span>
        </div>
      </div>
      <OrderTrackingMap
        title={`Delivery map - ${order.orderNumber}`}
        latitude={rider?.latitude ?? order.latitude}
        longitude={rider?.longitude ?? order.longitude}
      />
    </div>
  );
}
