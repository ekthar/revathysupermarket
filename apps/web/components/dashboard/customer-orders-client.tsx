"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, MapPin, Navigation, Package, RefreshCcw, RotateCcw, Star, XCircle } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { AnimatePresence, motion } from "framer-motion";
import { orderStatuses, statusLabels } from "@/lib/constants";
import { calculateDistanceKm } from "@/lib/distance";
import { readApiResponse } from "@/lib/client-api";
import { cn, formatCurrency } from "@/lib/utils";
import { DeliveryOtpCard } from "@/components/dashboard/delivery-otp-card";
import { OrderTrackingMap } from "@/components/dashboard/order-tracking-map";
import { useCart } from "@/components/cart/cart-provider";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { ReorderButton } from "@/components/dashboard/reorder-button";

const enableSseTracking = process.env.NEXT_PUBLIC_ENABLE_SSE_TRACKING !== "false";

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
  returnRequests?: Array<{ id: string; returnNumber: string; status: string }>;
  supportTickets?: Array<{ id: string; ticketNumber: string; status: string }>;
};
type LiveOrderState = {
  status?: keyof typeof statusLabels;
  deliveryPartnerLocation?: { latitude: number; longitude: number; updatedAt?: string } | null;
};

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

const customerTimelineStatuses = ["PENDING", "PROCESSING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"];

export function CustomerOrdersClient({ initialOrders, initialHistoryCursor = null }: { initialOrders: CustomerOrder[]; initialHistoryCursor?: string | null }) {
  const { addItems } = useCart();
  const { showToast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [liveOrders, setLiveOrders] = useState<Record<string, LiveOrderState>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [orderRating, setOrderRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [returnOrder, setReturnOrder] = useState<CustomerOrder | null>(null);
  const [historyCursor, setHistoryCursor] = useState(initialHistoryCursor);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [streamUnavailable, setStreamUnavailable] = useState(!enableSseTracking);
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

  function toggleExpand(orderId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  useEffect(() => {
    if (!enableSseTracking) return;
    const source = new EventSource("/api/orders/live-stream");
    source.onmessage = (event) => { const updates = JSON.parse(event.data) as Array<LiveOrderState & { id: string }>; setStreamUnavailable(false); setLastUpdated(new Date()); setLiveOrders((current) => Object.fromEntries(updates.map((item) => [item.id, item]))); setOrders((current) => current.map((entry) => { const update = updates.find((item) => item.id === entry.id); return update?.status ? { ...entry, status: update.status } : entry; })); };
    source.onerror = () => { source.close(); setStreamUnavailable(true); };
    return () => source.close();
  }, []);

  useEffect(() => {
    if (!streamUnavailable) return;
    let active = true;
    async function refresh() { if (document.visibilityState !== "visible" || !navigator.onLine) return; setIsRefreshing(true); const response = await fetch("/api/orders/live", { cache: "no-store" }).catch(() => null); if (response?.ok && active) { const data = await response.json() as { orders: Array<LiveOrderState & { id: string }> }; setOrders((current) => current.map((entry) => { const update = data.orders.find((item) => item.id === entry.id); return update?.status ? { ...entry, status: update.status } : entry; })); setLiveOrders(Object.fromEntries(data.orders.map((item) => [item.id, item]))); setLastUpdated(new Date()); } if (active) setIsRefreshing(false); }
    refresh(); const interval = window.setInterval(refresh, 30000); return () => { active = false; window.clearInterval(interval); };
  }, [streamUnavailable]);

  async function loadOlderOrders() { if (!historyCursor || historyLoading) return; setHistoryLoading(true); const response = await fetch(`/api/orders/history?cursor=${encodeURIComponent(historyCursor)}`, { cache: "no-store" }); const data = await readApiResponse<{ orders?: CustomerOrder[]; nextCursor?: string | null }>(response); setHistoryLoading(false); if (response.ok && data.orders) { setOrders((current) => [...current, ...data.orders!.filter((order) => !current.some((existing) => existing.id === order.id))]); setHistoryCursor(data.nextCursor ?? null); } }

  async function decideEdit(orderId: string, decision: "approved" | "rejected") {
    const response = await fetch(`/api/orders/${orderId}/approval`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) });
    if (response.ok) {
      const refresh = await fetch("/api/orders", { cache: "no-store" });
      const data = await readApiResponse<{ orders?: CustomerOrder[] }>(refresh);
      if (refresh.ok && data.orders) setOrders(data.orders);
      return;
    }
    const data = await readApiResponse<{ error?: string; code?: string }>(response);
    if (response.status === 503 && data.code === "RATE_LIMIT_UNAVAILABLE") {
      showToast("Our ordering system is temporarily busy. Please wait a moment and try again.", "error");
      return;
    }
    if (response.status === 429 && data.code === "RATE_LIMITED") {
      showToast("Too many attempts. Please wait a moment before trying again.", "error");
      return;
    }
    showToast(data.error ?? "Approval update failed.", "error");
  }


  async function submitFeedback() {
    if (!ratingOrderId) return;
    const response = await fetch(`/api/orders/${ratingOrderId}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderRating, deliveryRating, tags: [], comment: feedbackComment || undefined }) });
    if (!response.ok) {
      const data = await readApiResponse<{ error?: string; code?: string }>(response);
      if (response.status === 503 && data.code === "RATE_LIMIT_UNAVAILABLE") {
        showToast("Our ordering system is temporarily busy. Please wait a moment and try again.", "error");
        return;
      }
      if (response.status === 429 && data.code === "RATE_LIMITED") {
        showToast("Too many attempts. Please wait a moment before trying again.", "error");
        return;
      }
      showToast(data.error ?? "Feedback could not be saved.", "error");
      return;
    }
    setRatingOrderId(null); setFeedbackComment("");
  }

  if (orders.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-border p-10 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
          <Package className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-neutral-900 dark:text-white">No orders yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your grocery orders will appear here once you place your first order.</p>
        <Link href="/products" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity press">
          Start Shopping
        </Link>
      </motion.div>
    );
  }

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const completedOrders = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));

  // Build "Buy Again" items from delivered orders
  const buyAgainProducts = (() => {
    const productCounts = new Map<string, { product: Product; count: number }>();
    for (const order of orders) {
      if (order.status !== "DELIVERED") continue;
      for (const item of order.items) {
        if (!item.product || item.product.stock <= 0) continue;
        const existing = productCounts.get(item.product.id);
        if (existing) {
          existing.count += item.quantity;
        } else {
          productCounts.set(item.product.id, { product: item.product, count: item.quantity });
        }
      }
    }
    return Array.from(productCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((entry) => entry.product);
  })();

  return (
    <div className="space-y-3">
      {returnOrder && <ReturnRequestSheet order={returnOrder} onClose={() => setReturnOrder(null)} />}
      {ratingOrderId && <div className="fixed inset-0 z-[90] flex items-end justify-center bg-neutral-950/60 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="feedback-title"><div className="w-full max-w-md rounded-3xl bg-background p-5 shadow-2xl"><h2 id="feedback-title" className="font-display text-2xl font-black">Rate your order</h2><p className="mt-1 text-sm text-muted-foreground">Your feedback goes directly to the store team.</p>{[["Order", orderRating, setOrderRating], ["Delivery", deliveryRating, setDeliveryRating]].map(([label, value, setter]) => <div key={String(label)} className="mt-4"><p className="text-sm font-bold">{String(label)}</p><div className="mt-2 flex gap-2">{[1,2,3,4,5].map((rating) => <button key={rating} type="button" aria-label={`${label} ${rating} stars`} onClick={() => (setter as (value: number) => void)(rating)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted"><Star className={`h-5 w-5 ${rating <= Number(value) ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} /></button>)}</div></div>)}<label className="mt-4 block text-sm font-bold">Comment<textarea value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} maxLength={500} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background p-3" /></label><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setRatingOrderId(null)} className="h-11 rounded-2xl border border-border font-black">Cancel</button><button type="button" onClick={submitFeedback} className="h-11 rounded-2xl bg-primary font-black text-white">Submit</button></div></div></div>}

      {/* Buy Again section */}
      {buyAgainProducts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-neutral-100 bg-white p-4 card-shadow dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex items-center gap-2 mb-3">
            <RefreshCcw className="h-4 w-4 text-secondary-600" />
            <h2 className="text-sm font-black text-neutral-900 dark:text-white">Buy Again</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {buyAgainProducts.map((product) => (
              <motion.button
                key={product.id}
                type="button"
                onClick={() => { addItems([{ ...product, quantity: 1 }]); }}
                whileTap={{ scale: 0.94 }}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                {product.image && (
                  <img src={product.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                )}
                <div className="min-w-0">
                  <p className="text-micro font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[100px]">{product.name}</p>
                  <p className="text-micro text-neutral-500">{"\u20B9"}{product.discountPrice ?? product.price}</p>
                </div>
                <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white text-micro font-bold">+</span>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between rounded-2xl bg-white dark:bg-neutral-900 px-3 py-2 text-caption font-semibold text-neutral-500 dark:text-neutral-400 shadow-elevation-2 dark:shadow-none">
        <div className="flex items-center gap-3">
          <span className="text-neutral-700 dark:text-neutral-300">{activeOrders.length} active · {completedOrders.length} completed</span>
          <span className="text-neutral-400">·</span>
          <span>{lastUpdated ? "Updated just now" : streamUnavailable ? "Fallback" : "Live"}</span>
        </div>
        <RefreshCcw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-black")} />
      </div>

      {(() => {
        const groups: Array<{ title: string; key: string; orders: CustomerOrder[] }> = [];
        if (activeOrders.length > 0) groups.push({ title: "Active Orders", key: "active", orders: activeOrders });
        if (completedOrders.length > 0) groups.push({ title: "Past Orders", key: "past", orders: completedOrders });
        if (groups.length === 0) return null;
        return groups.map((group, idx) => (
          <div key={group.key} className={idx > 0 ? "mt-5" : ""}>
            <div className="flex items-center gap-2 px-1 mb-2">
              {group.key === "active" ? (
                <span className="flex h-2 w-2 rounded-full bg-success-500" />
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-neutral-300" />
              )}
              <h3 className="text-sm font-black text-neutral-900 dark:text-white">{group.title}</h3>
              <span className="text-micro font-normal text-neutral-400">({group.orders.length})</span>
            </div>
            <AnimatePresence initial={false}>
              {group.orders.map((order) => {
          const isExpanded = expandedIds.has(order.id);
          const cancelled = order.status === "CANCELLED";
          const delivered = order.status === "DELIVERED";
          const isComplete = delivered || cancelled;
          const activeIndex = customerTimelineStatuses.indexOf(order.status);
          const visibleItems = order.items.filter((item) => item.quantity > 0);
          const itemNames = visibleItems.slice(0, 3).map((i) => i.name).join(", ");
          const moreCount = visibleItems.length - 3;

          return (
            <motion.article
              key={order.id}
              layout={!isComplete}
              initial={isComplete ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={cn(
                "overflow-hidden rounded-lg border bg-white shadow-elevation-2 transition-shadow dark:bg-neutral-900",
                cancelled ? "border-red-200" : "border-neutral-100 dark:border-neutral-800",
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
                  cancelled ? "bg-red-100" : delivered ? "bg-success-100" : "bg-black"
                )}>
                  {cancelled ? <XCircle className="h-5 w-5 text-red-600" /> :
                   delivered ? <CheckCircle2 className="h-5 w-5 text-success-500" /> :
                   <Package className="h-5 w-5 text-white" />}
                </div>

                {/* Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body font-bold text-neutral-900 dark:text-white">Order #{order.orderNumber}</p>
                    <span className={cn(
                      "text-micro font-bold px-2 py-0.5 rounded-full",
                      cancelled ? "bg-red-100 text-red-700" :
                      delivered ? "bg-success-100 text-success-700" :
                      "bg-black text-white"
                    )}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="text-caption text-neutral-500 mt-0.5 truncate">
                    {itemNames}{moreCount > 0 ? ` +${moreCount} more` : ""}
                  </p>
                </div>

                {/* Price + date + chevron */}
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-body font-bold text-neutral-900 dark:text-white">{formatCurrency(order.total)}</p>
                    <p className="text-micro text-neutral-400 dark:text-neutral-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  </motion.div>
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                  >
                    <div className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                      {/* Status timeline - compact */}
                      {!cancelled && (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
                          className="flex items-center gap-1 mb-4 overflow-x-auto no-scrollbar pb-1"
                        >
                          {customerTimelineStatuses.map((status, index) => (
                            <motion.div
                              key={status}
                              variants={{ hidden: { opacity: 0, scale: 0.7 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 20 } } }}
                              className="flex items-center"
                            >
                              <div className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-micro font-bold transition-colors",
                                index <= activeIndex ? "bg-black text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500",
                                index === activeIndex && "ring-2 ring-black/20 animate-pulse"
                              )}>
                                {index < activeIndex ? "✓" : index + 1}
                              </div>
                              {index < customerTimelineStatuses.length - 1 && (
                                <div className={cn("h-[2px] w-4 sm:w-6 transition-colors", index < activeIndex ? "bg-black" : "bg-neutral-100 dark:bg-neutral-800")} />
                              )}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}

                      {cancelled && (
                        <div className="flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-red-700 dark:text-red-400 mb-4">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p className="text-caption font-semibold">This order was cancelled. Contact us for help.</p>
                        </div>
                      )}

                      {/* Edit approval */}
                      {order.status === "AWAITING_CUSTOMER_APPROVAL" && (
                        <OrderEditApprovalCard order={order} onDecision={(d) => decideEdit(order.id, d)} />
                      )}

                      {/* Items list - compact */}
                      <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3">
                        <p className="text-micro font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-2">Items</p>
                        <div className="space-y-1.5">
                          {visibleItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-caption">
                              <span className="text-neutral-700 dark:text-neutral-300">{item.name} <span className="text-neutral-400 dark:text-neutral-500">x{item.quantity}</span></span>
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between text-caption">
                          <span className="font-bold text-neutral-900 dark:text-white">Total</span>
                          <span className="font-bold text-neutral-900 dark:text-white">{formatCurrency(order.total)}</span>
                        </div>
                      </div>

                      {/* Actions for delivered orders */}
                      {Boolean(order.returnRequests?.length || order.supportTickets?.length) && <div className="mt-3 space-y-2 rounded-xl bg-muted p-3 text-caption">{order.returnRequests?.map((item) => <div key={item.id} className="flex justify-between gap-3"><span className="font-bold">Return {item.returnNumber}</span><span>{item.status.replaceAll("_", " ")}</span></div>)}{order.supportTickets?.map((item) => <div key={item.id} className="flex justify-between gap-3"><span className="font-bold">Ticket {item.ticketNumber}</span><span>{item.status.replaceAll("_", " ")}</span></div>)}</div>}
                      {delivered && (
                        <div className="mt-3">
                          <div className="grid grid-cols-3 gap-2">
                            <ReorderButton orderId={order.id} items={order.items} className="flex-1 h-9" />
                            <button onClick={() => setReturnOrder(order)} className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-caption font-bold text-neutral-700 dark:text-neutral-300">
                              <RotateCcw className="h-3.5 w-3.5" /> Return
                            </button>
                            <button onClick={() => setRatingOrderId(order.id)} className="h-9 flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 text-caption font-bold text-amber-700"><Star className="h-3.5 w-3.5" /> Rate</button>
                          </div>
                        </div>
                      )}

                      {/* Live tracking for active orders */}
                      {!isComplete && <LiveTrackingPanel order={order} live={liveOrders[order.id]} />}

                      {/* Track Order link for active orders */}
                      {!isComplete && (
                        <Link
                          href={`/track/${order.id}`}
                          className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-secondary-600 text-caption font-bold text-white shadow-sm hover:bg-secondary-700 transition-colors"
                        >
                          <Navigation className="h-4 w-4" />
                          Track Order
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
              })}
            </AnimatePresence>
          </div>
        ));
      })()}
      {historyCursor && <button disabled={historyLoading} onClick={loadOlderOrders} className="h-11 w-full rounded-2xl border border-border bg-background text-sm font-black disabled:opacity-50">{historyLoading ? "Loading…" : "Load older orders"}</button>}
    </div>
  );
}

function ReturnRequestSheet({ order, onClose }: { order: CustomerOrder; onClose: () => void }) {
  const { showToast } = useToast();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("quality_issue");
  const [note, setNote] = useState("");
  const [billNumber, setBillNumber] = useState(order.orderNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const selected = order.items.filter((item) => (quantities[item.id] ?? 0) > 0);
  const estimate = selected.reduce((sum, item) => sum + item.price * (quantities[item.id] ?? 0), 0);

  async function submit() {
    if (!selected.length) return setError("Select at least one item.");
    if (!billNumber.trim()) return setError("Bill number is required.");
    setLoading(true); setError("");
    const response = await fetch(`/api/orders/${order.id}/returns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, billNumber: billNumber.trim(), note: note || undefined, photoUrl: photoUrl || undefined, items: selected.map((item) => ({ orderItemId: item.id, quantity: quantities[item.id] })) }) });
    const data = await readApiResponse<{ error?: string; returnRequest?: { returnNumber?: string } }>(response);
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "Return request could not be submitted.");
    showToast(`Return ${data.returnRequest?.returnNumber ?? "request"} submitted.`, "success"); onClose();
  }

  async function upload(file?: File) { if (!file) return; setLoading(true); const body = new FormData(); body.set("file", file); const response = await fetch("/api/evidence/upload", { method: "POST", body }); const data = await response.json(); setLoading(false); if (!response.ok) return setError(data.error ?? "Evidence upload failed"); setPhotoUrl(data.url); }
  return <div className="fixed inset-0 z-[95] flex items-end justify-center bg-neutral-950/60 p-2 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="return-title"><div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-5 shadow-2xl sm:rounded-3xl"><div className="flex items-start justify-between gap-3"><div><h2 id="return-title" className="font-display text-2xl font-black">Request a return</h2><p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p></div><button onClick={onClose} aria-label="Close return form" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><XCircle className="h-5 w-5"/></button></div><div className="mt-4 divide-y divide-border rounded-2xl border border-border">{order.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 p-3"><div><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-muted-foreground">{formatCurrency(item.price)} · purchased {item.quantity}</p></div><select aria-label={`Return quantity for ${item.name}`} value={quantities[item.id] ?? 0} onChange={(e) => setQuantities((current) => ({ ...current, [item.id]: Number(e.target.value) }))} className="h-10 rounded-xl border border-border bg-background px-3">{Array.from({ length: item.quantity + 1 }, (_, value) => <option key={value} value={value}>{value}</option>)}</select></div>)}</div><label className="mt-4 block text-sm font-bold">Bill Number / Order Invoice Number<input type="text" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} required placeholder="Enter bill number" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3"/></label><label className="mt-4 block text-sm font-bold">Reason<select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3"><option value="wrong_item">Wrong item</option><option value="damaged">Damaged</option><option value="quality_issue">Quality issue</option><option value="changed_mind">Changed my mind</option><option value="other">Other</option></select></label><label className="mt-4 block text-sm font-bold">Tell us what happened<textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background p-3"/></label><label className="mt-4 block text-sm font-bold">Evidence photo (optional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0])} className="mt-2 block w-full text-sm"/></label>{photoUrl && <p className="mt-2 text-xs font-bold text-secondary-700">Photo uploaded</p>}<div className="mt-4 flex items-center justify-between rounded-xl bg-muted p-3 text-sm"><span>Estimated refund</span><strong>{formatCurrency(estimate)}</strong></div>{error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}<button disabled={loading || !selected.length} onClick={submit} className="mt-4 h-12 w-full rounded-2xl bg-primary font-black text-white disabled:opacity-50">{loading ? "Submitting…" : "Submit return request"}</button></div></div>;
}

function OrderEditApprovalCard({ order, onDecision }: { order: CustomerOrder; onDecision: (decision: "approved" | "rejected") => void }) {
  const totalDelta = order.editLogs.reduce((sum, log) => sum + log.priceDelta, 0);
  return (
    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 mb-4">
      <p className="text-caption font-bold text-amber-800 dark:text-amber-300">Order edit needs your approval</p>
      <div className="mt-2 space-y-1.5">
        {order.editLogs.map((log) => {
          const original = readEditItem(log.originalItem);
          const updated = readEditItem(log.newItem);
          return (
            <div key={log.id} className="flex justify-between text-caption bg-white/70 dark:bg-neutral-800/70 rounded-lg p-2">
              <span className="text-neutral-700 dark:text-neutral-300">{editActionLabel(log.action)}: {original.name}</span>
              <span className={cn("font-bold", log.priceDelta >= 0 ? "text-amber-700" : "text-success-700")}>
                {log.priceDelta >= 0 ? "+" : ""}{formatCurrency(log.priceDelta)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => onDecision("approved")} className="h-9 rounded-xl bg-primary text-caption font-bold text-white flex items-center justify-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
        </button>
        <button onClick={() => onDecision("rejected")} className="h-9 rounded-xl bg-red-600 text-caption font-bold text-white flex items-center justify-center gap-1">
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
  const distance = rider ? calculateDistanceKm(
    { lat: rider.latitude, lng: rider.longitude },
    { lat: destination.latitude, lng: destination.longitude }
  ) : null;
  const etaMinutes = distance !== null ? Math.max(2, Math.ceil((distance / 18) * 60)) : null;

  return (
    <div className="mt-3 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
      <div className="p-3 space-y-2">
        {order.deliveryOtp && !order.deliveryOtp.includes("*") && ["OUT_FOR_DELIVERY", "READY_FOR_DELIVERY"].includes(order.status) && (
          <DeliveryOtpCard otp={order.deliveryOtp} />
        )}
        <div className="flex items-center gap-2 text-caption">
          <Navigation className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
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
