"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock, MapPin, Navigation, Package, RefreshCcw, RotateCcw, Star, XCircle, Receipt, ShoppingBag } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { AnimatePresence, motion } from "framer-motion";
import { springs } from "@/lib/motion";
import { orderStatuses, statusLabels } from "@/lib/constants";
import { calculateDistanceKm } from "@/lib/distance";
import { readApiResponse } from "@/lib/client-api";
import { cn, formatCurrency } from "@/lib/utils";
import { DeliveryOtpCard } from "@/components/dashboard/delivery-otp-card";
import { OrderTrackingMap } from "@/components/dashboard/order-tracking-map";
import { useCart } from "@/components/cart/cart-provider";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { ReorderButton } from "@/components/dashboard/reorder-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { haptic } from "@/lib/haptics";

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


// ─── Helpers ───
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function getMonthLabel(key: string) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

const customerTimelineStatuses = ["PENDING", "PROCESSING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"];


// ─── Main Component ───
export function CustomerOrdersClient({ initialOrders, initialHistoryCursor = null }: { initialOrders: CustomerOrder[]; initialHistoryCursor?: string | null }) {
  const router = useRouter();
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
  const [historyCursor, setHistoryCursor] = useState(initialHistoryCursor);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [streamUnavailable, setStreamUnavailable] = useState(!enableSseTracking);
  const [detailOrder, setDetailOrder] = useState<CustomerOrder | null>(null);
  const [returnOrder, setReturnOrder] = useState<CustomerOrder | null>(null);

  // SSE real-time updates
  useEffect(() => {
    if (!enableSseTracking) return;
    const source = new EventSource("/api/orders/live-stream");
    source.onmessage = (event) => {
      const updates = JSON.parse(event.data) as Array<LiveOrderState & { id: string }>;
      setStreamUnavailable(false);
      setLastUpdated(new Date());
      setLiveOrders((current) => Object.fromEntries(updates.map((item) => [item.id, item])));
      setOrders((current) => current.map((entry) => {
        const update = updates.find((item) => item.id === entry.id);
        return update?.status ? { ...entry, status: update.status } : entry;
      }));
    };
    source.onerror = () => { source.close(); setStreamUnavailable(true); };
    return () => source.close();
  }, []);


  // Polling fallback
  useEffect(() => {
    if (!streamUnavailable) return;
    let active = true;
    async function refresh() {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      setIsRefreshing(true);
      const response = await fetch("/api/orders/live", { cache: "no-store" }).catch(() => null);
      if (response?.ok && active) {
        const data = await response.json() as { orders: Array<LiveOrderState & { id: string }> };
        setOrders((current) => current.map((entry) => {
          const update = data.orders.find((item) => item.id === entry.id);
          return update?.status ? { ...entry, status: update.status } : entry;
        }));
        setLiveOrders(Object.fromEntries(data.orders.map((item) => [item.id, item])));
        setLastUpdated(new Date());
      }
      if (active) setIsRefreshing(false);
    }
    refresh();
    const interval = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, [streamUnavailable]);

  async function loadOlderOrders() {
    if (!historyCursor || historyLoading) return;
    setHistoryLoading(true);
    const response = await fetch(`/api/orders/history?cursor=${encodeURIComponent(historyCursor)}`, { cache: "no-store" });
    const data = await readApiResponse<{ orders?: CustomerOrder[]; nextCursor?: string | null }>(response);
    setHistoryLoading(false);
    if (response.ok && data.orders) {
      setOrders((current) => [...current, ...data.orders!.filter((order) => !current.some((existing) => existing.id === order.id))]);
      setHistoryCursor(data.nextCursor ?? null);
    }
  }

  async function submitFeedback() {
    if (!ratingOrderId) return;
    const response = await fetch(`/api/orders/${ratingOrderId}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderRating, deliveryRating, tags: [], comment: feedbackComment || undefined }) });
    if (!response.ok) { showToast("Feedback could not be saved.", "error"); return; }
    setRatingOrderId(null);
    setFeedbackComment("");
    showToast("Thanks for your feedback!", "success");
  }


  if (orders.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-border p-10 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
          <Package className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-neutral-900 dark:text-white">No orders yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your grocery orders will appear here once you place your first order.</p>
        <Link href="/products" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white dark:bg-white dark:text-black">Start Shopping</Link>
      </motion.div>
    );
  }

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const completedOrders = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));

  // Group completed orders by month (Swiggy-style)
  const monthGroups = new Map<string, CustomerOrder[]>();
  for (const order of completedOrders) {
    const key = getMonthKey(order.createdAt);
    const group = monthGroups.get(key) || [];
    group.push(order);
    monthGroups.set(key, group);
  }
  const sortedMonths = Array.from(monthGroups.entries()).sort((a, b) => b[0].localeCompare(a[0]));


  return (
    <PullToRefresh onRefresh={async () => { router.refresh(); await new Promise((r) => setTimeout(r, 500)); }}>
    <div className="space-y-4">
      {/* Rating modal */}
      {ratingOrderId && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-neutral-950/60 p-3 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-background p-5 shadow-2xl">
            <h2 className="font-display text-2xl font-black">Rate your order</h2>
            {[["Order", orderRating, setOrderRating], ["Delivery", deliveryRating, setDeliveryRating]].map(([label, value, setter]) => (
              <div key={String(label)} className="mt-4">
                <p className="text-sm font-bold">{String(label)}</p>
                <div className="mt-2 flex gap-2">{[1,2,3,4,5].map((r) => <button key={r} type="button" onClick={() => (setter as (v: number) => void)(r)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted"><Star className={`h-5 w-5 ${r <= Number(value) ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} /></button>)}</div>
              </div>
            ))}
            <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} maxLength={500} placeholder="Tell us more..." className="mt-4 min-h-20 w-full rounded-2xl border border-border bg-background p-3 text-sm" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setRatingOrderId(null)} className="h-11 rounded-2xl border border-border font-black">Cancel</button>
              <button type="button" onClick={submitFeedback} className="h-11 rounded-2xl bg-primary font-black text-white">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Return sheet */}
      {returnOrder && <ReturnRequestSheet order={returnOrder} onClose={() => setReturnOrder(null)} />}

      {/* Order Detail Sheet */}
      <BottomSheet open={!!detailOrder} onClose={() => setDetailOrder(null)} title={detailOrder ? `Order #${detailOrder.orderNumber}` : undefined}>
        {detailOrder && <OrderDetailContent order={detailOrder} />}
      </BottomSheet>


      {/* ─── ACTIVE ORDERS ─── */}
      {activeOrders.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-secondary-500 animate-pulse" />
            <h3 className="text-sm font-black text-neutral-900 dark:text-white">Active Orders</h3>
            <span className="text-xs text-neutral-400">({activeOrders.length})</span>
          </div>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <ActiveOrderCard
                key={order.id}
                order={order}
                live={liveOrders[order.id]}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── PAST ORDERS (Month-grouped, Swiggy-style) ─── */}
      {sortedMonths.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-neutral-400" />
            <h3 className="text-sm font-black text-neutral-900 dark:text-white">Past Orders</h3>
          </div>
          {sortedMonths.map(([monthKey, monthOrders]) => (
            <div key={monthKey} className="mb-5">
              {/* Month header - sticky */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {getMonthLabel(monthKey)}
                </p>
              </div>
              {/* Orders in this month */}
              <div className="space-y-2">
                {monthOrders.map((order) => (
                  <PastOrderCard
                    key={order.id}
                    order={order}
                    onTap={() => { setDetailOrder(order); haptic("light"); }}
                    onRate={() => setRatingOrderId(order.id)}
                    onReturn={() => setReturnOrder(order)}
                  />
                ))}
              </div>
            </div>
          ))}
          {historyCursor && (
            <button disabled={historyLoading} onClick={loadOlderOrders} className="h-11 w-full rounded-2xl border border-border bg-background text-sm font-black disabled:opacity-50">
              {historyLoading ? "Loading..." : "Load older orders"}
            </button>
          )}
        </section>
      )}
    </div>
    </PullToRefresh>
  );
}


// ─── Active Order Card (immersive tracking preview) ───
function ActiveOrderCard({ order, live }: { order: CustomerOrder; live?: LiveOrderState }) {
  const { showToast } = useToast();
  const router = useRouter();
  const [processingApproval, setProcessingApproval] = useState(false);
  const activeIndex = customerTimelineStatuses.indexOf(order.status);
  const rider = live?.deliveryPartnerLocation ?? order.deliveryPartnerLocation;
  const distance = rider ? calculateDistanceKm(
    { lat: rider.latitude, lng: rider.longitude },
    { lat: order.latitude, lng: order.longitude }
  ) : null;
  const etaMinutes = distance !== null ? Math.max(2, Math.ceil((distance / 18) * 60)) : null;
  const itemNames = order.items.slice(0, 2).map((i) => i.name).join(", ");
  const needsApproval = order.status === "AWAITING_CUSTOMER_APPROVAL" && order.editLogs.length > 0;

  async function handleApproval(decision: "approved" | "rejected") {
    setProcessingApproval(true);
    const response = await fetch(`/api/orders/${order.id}/approval`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) });
    setProcessingApproval(false);
    if (response.ok) {
      showToast(decision === "approved" ? "Changes approved!" : "Changes rejected", "success");
      router.refresh();
    } else {
      showToast("Could not process. Try again.", "error");
    }
  }

  // Show approval UI when order needs customer approval
  if (needsApproval) {
    const totalDelta = order.editLogs.reduce((sum, log) => sum + log.priceDelta, 0);
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-black text-amber-800 dark:text-amber-300">Order #{order.orderNumber} — Approval Needed</p>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
          The store made changes to your order. Please review and approve or reject.
        </p>
        {/* Edit details */}
        <div className="space-y-2 mb-3">
          {order.editLogs.map((log) => {
            const action = log.action === "remove" ? "Removed" : log.action === "substitute" ? "Substituted" : log.action === "quantity-change" ? "Qty changed" : "Updated";
            const original = log.originalItem as { name?: string } | null;
            const updated = log.newItem as { name?: string } | null;
            return (
              <div key={log.id} className="flex justify-between items-center rounded-lg bg-white dark:bg-neutral-800 px-3 py-2">
                <div className="text-xs">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">{action}: </span>
                  <span className="text-neutral-600 dark:text-neutral-400">{original?.name || updated?.name || "Item"}</span>
                </div>
                <span className={cn("text-xs font-bold", log.priceDelta >= 0 ? "text-amber-700" : "text-green-600")}>
                  {log.priceDelta >= 0 ? "+" : ""}{formatCurrency(log.priceDelta)}
                </span>
              </div>
            );
          })}
        </div>
        {totalDelta !== 0 && (
          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-3">
            New total: {totalDelta > 0 ? `+${formatCurrency(totalDelta)}` : formatCurrency(totalDelta)} change
          </p>
        )}
        {/* Approval buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleApproval("approved")}
            disabled={processingApproval}
            className="h-10 rounded-xl bg-secondary-500 text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 transition-transform"
          >
            <CheckCircle2 className="h-4 w-4" /> Approve
          </button>
          <button
            type="button"
            onClick={() => handleApproval("rejected")}
            disabled={processingApproval}
            className="h-10 rounded-xl bg-red-500 text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 transition-transform"
          >
            <XCircle className="h-4 w-4" /> Reject
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <Link href={`/track/${order.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-secondary-600 to-secondary-500 p-4 text-white shadow-lg shadow-secondary-500/20 active:scale-[0.98] transition-transform"
      >
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Order #{order.orderNumber}</p>
            <p className="text-lg font-black">{statusLabels[order.status]}</p>
          </div>
          {etaMinutes && (
            <div className="text-right">
              <p className="text-2xl font-black">{etaMinutes}</p>
              <p className="text-[10px] font-bold uppercase text-white/60">MIN</p>
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="mt-3 flex items-center gap-1">
          {customerTimelineStatuses.map((_, idx) => (
            <div key={idx} className={cn("h-1.5 flex-1 rounded-full transition-all", idx <= activeIndex ? "bg-white" : "bg-white/25")} />
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-white/70 truncate max-w-[60%]">{itemNames}</p>
          <div className="flex items-center gap-1 text-xs font-bold text-white/90">
            <span>Track</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* OTP */}
        {order.deliveryOtp && !order.deliveryOtp.includes("*") && ["OUT_FOR_DELIVERY", "READY_FOR_DELIVERY"].includes(order.status) && (
          <div className="mt-2 rounded-xl bg-white/15 px-3 py-1.5 text-center">
            <p className="text-[10px] text-white/60 uppercase">Delivery PIN</p>
            <p className="font-mono text-lg font-black tracking-widest">{order.deliveryOtp}</p>
          </div>
        )}
      </motion.div>
    </Link>
  );
}


// ─── Past Order Card (Swiggy-style compact) ───
function PastOrderCard({ order, onTap, onRate, onReturn }: { order: CustomerOrder; onTap: () => void; onRate: () => void; onReturn: () => void }) {
  const delivered = order.status === "DELIVERED";
  const cancelled = order.status === "CANCELLED";
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const itemPreview = order.items.slice(0, 3).map((i) => i.name).join(", ");
  const moreCount = order.items.length - 3;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden"
    >
      {/* Main card - tappable for details */}
      <button type="button" onClick={onTap} className="w-full text-left p-4 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors">
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", delivered ? "bg-secondary-100 dark:bg-secondary-900/30" : "bg-red-100 dark:bg-red-900/30")}>
            {delivered ? <CheckCircle2 className="h-5 w-5 text-secondary-600" /> : <XCircle className="h-5 w-5 text-red-500" />}
          </div>
          {/* Order info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">#{order.orderNumber}</span>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", delivered ? "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400")}>
                {delivered ? "Delivered" : "Cancelled"}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {itemPreview}{moreCount > 0 ? ` +${moreCount} more` : ""}
            </p>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-400">
              <span>{formatDate(order.createdAt)}</span>
              <span>•</span>
              <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
              <span>•</span>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatCurrency(order.total)}</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600 mt-3 shrink-0" />
        </div>
      </button>

      {/* Quick actions bar */}
      {delivered && (
        <div className="flex border-t border-neutral-100 dark:border-neutral-800 divide-x divide-neutral-100 dark:divide-neutral-800">
          <ReorderButton orderId={order.id} items={order.items} className="flex-1 h-10 rounded-none border-0 text-[11px]" />
          <button type="button" onClick={onRate} className="flex-1 h-10 flex items-center justify-center gap-1 text-[11px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10">
            <Star className="h-3 w-3" /> Rate
          </button>
          <button type="button" onClick={onReturn} className="flex-1 h-10 flex items-center justify-center gap-1 text-[11px] font-bold text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800">
            <RotateCcw className="h-3 w-3" /> Return
          </button>
        </div>
      )}
    </motion.div>
  );
}


// ─── Order Detail Content (shown in BottomSheet — Swiggy receipt style) ───
function OrderDetailContent({ order }: { order: CustomerOrder }) {
  const delivered = order.status === "DELIVERED";
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = order.total - subtotal > 0 ? order.total - subtotal : 0;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={cn("rounded-xl p-3 flex items-center gap-3", delivered ? "bg-secondary-50 dark:bg-secondary-900/20" : "bg-red-50 dark:bg-red-900/20")}>
        {delivered ? <CheckCircle2 className="h-5 w-5 text-secondary-600" /> : <XCircle className="h-5 w-5 text-red-500" />}
        <div>
          <p className={cn("text-sm font-bold", delivered ? "text-secondary-700 dark:text-secondary-400" : "text-red-600 dark:text-red-400")}>
            {delivered ? "Delivered successfully" : "Order was cancelled"}
          </p>
          <p className="text-xs text-neutral-500">{formatDate(order.createdAt)} at {formatTime(order.createdAt)}</p>
        </div>
      </div>

      {/* Items */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Items Ordered</p>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600">{item.quantity}x</span>
                <span className="text-sm text-neutral-800 dark:text-neutral-200">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bill breakdown */}
      <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700 pt-3 space-y-2">
        <div className="flex justify-between text-sm text-neutral-500">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm text-neutral-500">
            <span>Delivery</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
        )}
        {deliveryFee === 0 && subtotal < order.total && null}
        <div className="flex justify-between text-sm font-bold text-neutral-900 dark:text-white border-t border-neutral-200 dark:border-neutral-700 pt-2">
          <span>Total Paid</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Order metadata */}
      <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3 space-y-1.5 text-xs">
        <div className="flex justify-between"><span className="text-neutral-400">Order ID</span><span className="font-semibold text-neutral-700 dark:text-neutral-300">#{order.orderNumber}</span></div>
        <div className="flex justify-between"><span className="text-neutral-400">Date</span><span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatDate(order.createdAt)}</span></div>
        <div className="flex justify-between"><span className="text-neutral-400">Time</span><span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatTime(order.createdAt)}</span></div>
      </div>
    </div>
  );
}


// ─── Return Request Sheet ───
function ReturnRequestSheet({ order, onClose }: { order: CustomerOrder; onClose: () => void }) {
  const { showToast } = useToast();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("quality_issue");
  const [note, setNote] = useState("");
  const [billNumber, setBillNumber] = useState(order.orderNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selected = order.items.filter((item) => (quantities[item.id] ?? 0) > 0);
  const estimate = selected.reduce((sum, item) => sum + item.price * (quantities[item.id] ?? 0), 0);

  async function submit() {
    if (!selected.length) return setError("Select at least one item.");
    if (!billNumber.trim()) return setError("Bill number is required.");
    setLoading(true); setError("");
    const response = await fetch(`/api/orders/${order.id}/returns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, billNumber: billNumber.trim(), note: note || undefined, items: selected.map((item) => ({ orderItemId: item.id, quantity: quantities[item.id] })) }) });
    const data = await readApiResponse<{ error?: string; returnRequest?: { returnNumber?: string } }>(response);
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "Return request could not be submitted.");
    showToast(`Return ${data.returnRequest?.returnNumber ?? "request"} submitted.`, "success");
    onClose();
  }

  return (
    <BottomSheet open onClose={onClose} title="Request a return">
      <p className="-mt-2 text-sm text-muted-foreground">Order #{order.orderNumber}</p>
      <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 p-3">
            <div>
              <p className="text-sm font-bold">{item.name}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} · purchased {item.quantity}</p>
            </div>
            <select value={quantities[item.id] ?? 0} onChange={(e) => setQuantities((c) => ({ ...c, [item.id]: Number(e.target.value) }))} className="h-10 rounded-xl border border-border bg-background px-3">
              {Array.from({ length: item.quantity + 1 }, (_, v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        ))}
      </div>
      <input type="text" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="Bill number" className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
        <option value="wrong_item">Wrong item</option>
        <option value="damaged">Damaged</option>
        <option value="quality_issue">Quality issue</option>
        <option value="changed_mind">Changed my mind</option>
      </select>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Additional details..." className="mt-3 min-h-20 w-full rounded-xl border border-border bg-background p-3 text-sm" />
      <div className="mt-3 flex justify-between rounded-xl bg-muted p-3 text-sm"><span>Estimated refund</span><strong>{formatCurrency(estimate)}</strong></div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button disabled={loading || !selected.length} onClick={submit} className="mt-4 h-12 w-full rounded-2xl bg-primary font-black text-white disabled:opacity-50">
        {loading ? "Submitting..." : "Submit return request"}
      </button>
    </BottomSheet>
  );
}
