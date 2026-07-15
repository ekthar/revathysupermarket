"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, ChevronDown, FileText, Phone, Send } from "lucide-react";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { statusLabels } from "@/lib/constants";
import { SITE } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
import { formatQuantityWithUnit, shouldShowBilledBadge, shouldShowPackingBadge } from "@msm/shared";
import { useAdminOrders, useAcknowledgeOrder, useAssignDelivery, useRegenerateOtp, ADMIN_ORDERS_QUERY_KEY } from "@/lib/queries/admin-orders";
import { useQueryClient } from "@tanstack/react-query";
import { OrderActionModal } from "@/components/admin/orders/order-action-modal";
import { OrderFilters } from "@/components/admin/orders/order-filters";
import { OrderListBoard } from "@/components/admin/orders/order-list";

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  status: keyof typeof statusLabels;
  deliveryPartnerId?: string | null;
  deliveryOtp?: string | null;
  deliveryOtpAttempts: number;
  deliveryOtpExpiresAt: string | null;
  deliveryInstructions?: string | null;
  staffNote?: string | null;
  billNumber?: string | null;
  acknowledgedAt: string | null;
  printedAt: string | null;
  printCount: number;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number; price: number; gstRate: number | null; unit: string }>;
  whatsappLogs: Array<{ id: string; template: string; status: string; createdAt: string }>;
};
type AdminProduct = { id: string; name: string; price: number };
type DeliveryPartner = { id: string; name: string };

function timeSince(value: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

export function AdminOrdersClient({
  orders,
  products,
  deliveryPartners,
  printAlertEnabled = false,
  printAlertThresholdMinutes = 10
}: {
  orders: AdminOrder[];
  products: AdminProduct[];
  deliveryPartners: DeliveryPartner[];
  printAlertEnabled?: boolean;
  printAlertThresholdMinutes?: number;
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: localOrders } = useAdminOrders(orders);
  const acknowledgeMutation = useAcknowledgeOrder();
  const assignDeliveryMutation = useAssignDelivery();
  const regenerateOtpMutation = useRegenerateOtp();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "new" | "pending" | "packing" | "delivered">("all");
  const [view, setView] = useState<"board" | "list">("board");
  const [now, setNow] = useState(() => Date.now());
  const [ackLoading, setAckLoading] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, { quantity: string; productId: string; reason: string }>>({});
  const [staffNotes, setStaffNotes] = useState<Record<string, string>>(() => Object.fromEntries(orders.map((order) => [order.id, order.staffNote ?? ""])));
  const [billNumberDrafts, setBillNumberDrafts] = useState<Record<string, string>>(() => Object.fromEntries(orders.map((order) => [order.id, order.billNumber ?? ""])));
  const [billNumberSaving, setBillNumberSaving] = useState<string | null>(null);
  const [billNumberErrors, setBillNumberErrors] = useState<Record<string, string>>({});
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(() => {
    // Only expand undelivered/uncancelled orders. Delivered = collapsed by default
    const active = new Set<string>();
    let count = 0;
    for (const order of orders) {
      if (!["DELIVERED", "CANCELLED"].includes(order.status)) {
        active.add(order.id);
        count++;
        if (count >= 10) break;
      }
    }
    return active;
  });

  function toggleOrderExpand(orderId: string) {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  const unacknowledgedNewOrders = useMemo(
    () => localOrders.filter((order) => order.status === "ORDER_RECEIVED" && !order.acknowledgedAt),
    [localOrders]
  );

  const counts = useMemo(() => ({
    all: localOrders.length,
    new: unacknowledgedNewOrders.length,
    pending: localOrders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length,
    packing: localOrders.filter((order) => order.status === "PACKING").length,
    delivered: localOrders.filter((order) => order.status === "DELIVERED").length
  }), [localOrders, unacknowledgedNewOrders.length]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function unlockSound() {
      setSoundUnlocked(true);
      window.removeEventListener("pointerdown", unlockSound);
      window.removeEventListener("keydown", unlockSound);
    }
    window.addEventListener("pointerdown", unlockSound);
    window.addEventListener("keydown", unlockSound);
    return () => {
      window.removeEventListener("pointerdown", unlockSound);
      window.removeEventListener("keydown", unlockSound);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (unacknowledgedNewOrders.length === 0) return;

    const originalTitle = document.title;
    let alertTitle = false;
    const titleTimer = window.setInterval(() => {
      alertTitle = !alertTitle;
      document.title = alertTitle ? "New order!" : originalTitle;
    }, 1000);

    const audioTimer = window.setInterval(() => {
      if (!soundUnlocked) return;
      try {
        const BrowserAudioContext = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
        if (!BrowserAudioContext) return;
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new BrowserAudioContext();
        }
        const audioContext = audioCtxRef.current;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.frequency.value = 880;
        gain.gain.value = 0.04;
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        window.setTimeout(() => {
          try {
            oscillator.stop();
          } catch {}
        }, 180);
      } catch {
        window.clearInterval(audioTimer);
      }
    }, 2500);

    return () => {
      document.title = originalTitle;
      window.clearInterval(titleTimer);
      window.clearInterval(audioTimer);
    };
  }, [soundUnlocked, unacknowledgedNewOrders.length]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return localOrders.filter((order) => {
      const matchesTab =
        tab === "all" ||
        (tab === "new" && order.status === "ORDER_RECEIVED" && !order.acknowledgedAt) ||
        (tab === "pending" && !["DELIVERED", "CANCELLED"].includes(order.status)) ||
        (tab === "packing" && order.status === "PACKING") ||
        (tab === "delivered" && order.status === "DELIVERED");
      const matchesQuery = !needle || [order.orderNumber, order.customerName, order.phone, order.address]
        .join(" ")
        .toLowerCase()
        .includes(needle);
      return matchesTab && matchesQuery;
    });
  }, [localOrders, query, tab]);

  function updateOrderStatus(orderId: string, status: keyof typeof statusLabels) {
    queryClient.setQueryData<AdminOrder[]>(ADMIN_ORDERS_QUERY_KEY, (current) =>
      current?.map((order) => (order.id === orderId ? { ...order, status } : order)) ?? []
    );
  }

  async function acknowledgeOrder(orderId: string) {
    setAckLoading(orderId);
    acknowledgeMutation.mutate(orderId, {
      onSettled: () => setAckLoading(null),
    });
  }

  function dismissAlert(orderId: string) {
    setDismissedAlertIds((current) => new Set([...current, orderId]));
  }

  async function editItem(orderId: string, itemId: string, action: "remove" | "quantity-change" | "substitute") {
    const draft = editDrafts[itemId] ?? { quantity: "", productId: "", reason: "" };
    setEditLoading(itemId);
    const response = await fetch(`/api/admin/orders/${orderId}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        itemId,
        quantity: draft.quantity ? Number(draft.quantity) : undefined,
        productId: draft.productId || undefined,
        reason: draft.reason || undefined
      })
    });
    const data = await readApiResponse<{ error?: string; priceDelta?: number; requiresCustomerApproval?: boolean }>(response);
    setEditLoading(null);
    if (!response.ok) {
      showToast(data.error ?? "Order edit failed", "error");
      return;
    }
    showToast(data.requiresCustomerApproval ? "Edit saved and customer approval is pending" : "Order updated", "success");
    queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_QUERY_KEY });
  }

  function updateDraft(itemId: string, patch: Partial<{ quantity: string; productId: string; reason: string }>) {
    setEditDrafts((current) => {
      const existing = current[itemId] ?? { quantity: "", productId: "", reason: "" };
      const updated = { ...existing, ...patch };

      // When a substitute product is selected, default quantity to 1
      // so staff never accidentally submit a zero-quantity substitute
      if (patch.productId && patch.productId !== "" && !existing.quantity) {
        updated.quantity = "1";
      }

      return { ...current, [itemId]: updated };
    });
  }

  async function assignDelivery(orderId: string, deliveryPartnerId: string) {
    setAssignLoading(orderId);
    assignDeliveryMutation.mutate(
      { orderId, deliveryPartnerId },
      {
        onSuccess: () => {
          showToast("Delivery partner assigned", "success");
        },
        onError: (error) => {
          showToast(error.message ?? "Delivery assignment failed", "error");
        },
        onSettled: () => setAssignLoading(null),
      }
    );
  }

  async function regenerateOtp(orderId: string) {
    setOtpLoading(orderId);
    regenerateOtpMutation.mutate(orderId, {
      onSuccess: () => {
        showToast("Delivery OTP regenerated", "success");
      },
      onError: (error) => {
        showToast(error.message ?? "OTP regenerate failed", "error");
      },
      onSettled: () => setOtpLoading(null),
    });
  }

  async function saveStaffNote(order: AdminOrder) {
    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: order.status, staffNote: staffNotes[order.id] ?? "" })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      showToast(data.error ?? "Staff note failed", "error");
      return;
    }
    queryClient.setQueryData<AdminOrder[]>(ADMIN_ORDERS_QUERY_KEY, (current) =>
      current?.map((entry) => entry.id === order.id ? { ...entry, staffNote: staffNotes[order.id] ?? "" } : entry) ?? []
    );
    showToast("Staff note saved", "success");
  }

  async function saveBillNumber(orderId: string) {
    const billNumber = (billNumberDrafts[orderId] ?? "").trim();
    if (!billNumber) {
      setBillNumberErrors((prev) => ({ ...prev, [orderId]: "Enter a bill number" }));
      return;
    }
    // Clear any previous error when submitting
    setBillNumberErrors((prev) => { const next = { ...prev }; delete next[orderId]; return next; });
    setBillNumberSaving(orderId);
    const response = await fetch(`/api/admin/orders/${orderId}/bill-number`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billNumber }),
    });
    const data = await readApiResponse<{ error?: string; order?: { id: string; billNumber: string } }>(response);
    setBillNumberSaving(null);
    if (!response.ok) {
      // Display error inline (especially for 409 duplicate bill number)
      const errorMessage = data.error ?? "Failed to save bill number";
      setBillNumberErrors((prev) => ({ ...prev, [orderId]: errorMessage }));
      return;
    }
    queryClient.setQueryData<AdminOrder[]>(ADMIN_ORDERS_QUERY_KEY, (current) =>
      current?.map((entry) => entry.id === orderId ? { ...entry, billNumber } : entry) ?? []
    );
    showToast("Bill number saved", "success");
  }

  function manualWhatsAppLink(order: AdminOrder) {
    const text = [
      `${SITE.name} order #${order.orderNumber}`,
      `Status: ${statusLabels[order.status]}`,
      order.deliveryOtp ? `Delivery OTP: ${order.deliveryOtp}` : "",
      `Total: ${formatCurrency(order.total)}`
    ].filter(Boolean).join("\n");
    return `https://wa.me/${order.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  }

  return (
    <>
      {unacknowledgedNewOrders
        .filter((order) => !dismissedAlertIds.has(order.id))
        .slice(0, 1)
        .map((order) => (
          <OrderActionModal
            key={order.id}
            order={order}
            onAcknowledge={acknowledgeOrder}
            onDismiss={dismissAlert}
            ackLoading={ackLoading}
          />
        ))}
      <OrderFilters
        query={query}
        onQueryChange={setQuery}
        tab={tab}
        onTabChange={setTab}
        view={view}
        onViewChange={setView}
        counts={counts}
      />
      {/* Unprinted order alert — high visibility when threshold exceeded */}
      {printAlertEnabled && (() => {
        const thresholdMs = printAlertThresholdMinutes * 60 * 1000;
        const unprintedOverdue = localOrders.filter(
          (o) => !o.printedAt && !["ORDER_RECEIVED", "CANCELLED"].includes(o.status) && (now - new Date(o.createdAt).getTime()) > thresholdMs
        );
        if (unprintedOverdue.length === 0) return null;
        return (
          <div className="mt-4 rounded-2xl border-2 border-red-400 bg-red-50 dark:bg-red-950/30 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🖨️</span>
              <div>
                <p className="text-sm font-black text-red-700 dark:text-red-300">
                  {unprintedOverdue.length} order{unprintedOverdue.length > 1 ? "s" : ""} unprinted for over {printAlertThresholdMinutes} minutes
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  Orders: {unprintedOverdue.slice(0, 5).map((o) => `#${o.orderNumber}`).join(", ")}{unprintedOverdue.length > 5 ? ` +${unprintedOverdue.length - 5} more` : ""}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
      {view === "board" && <OrderListBoard
        orders={localOrders}
        now={now}
        onSelectOrder={(orderNumber) => { setQuery(orderNumber); setView("list"); }}
      />}
      <div className={cn("mt-5 space-y-6", view === "board" && "hidden")}>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">No orders found.</div>
        ) : (() => {
          // Group orders by IST calendar day
          const groups = new Map<string, typeof filtered>();
          for (const order of filtered) {
            const day = new Date(order.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "2-digit", month: "short", year: "numeric" });
            if (!groups.has(day)) groups.set(day, []);
            groups.get(day)!.push(order);
          }
          return Array.from(groups.entries()).map(([day, dayOrders]) => (
            <div key={day}>
              {/* Day separator */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{day}</span>
                <div className="flex-1 border-t border-border" />
                <span className="text-xs font-bold text-muted-foreground">{dayOrders.length} order{dayOrders.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid gap-3">
        {dayOrders.map((order) => (
          <article
            key={order.id}
            className={cn(
              "rounded-xl border bg-card/95 overflow-hidden shadow-soft dark:border-white/10",
              order.status === "CANCELLED" ? "border-red-200 bg-red-50/90 dark:border-red-500/30 dark:bg-red-950/25" : "border-white/70"
            )}
          >
            {/* Collapsible header */}
            <button
              type="button"
              onClick={() => toggleOrderExpand(order.id)}
              className="w-full text-left px-4 py-3.5 flex items-center gap-3 sm:px-5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-title font-bold text-foreground">#{order.orderNumber}</h3>
                  {order.status === "ORDER_RECEIVED" && !order.acknowledgedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-micro font-bold text-white">
                      <BellRing className="h-3 w-3" /> New
                    </span>
                  ) : null}
                  <span className={cn("text-micro font-bold px-2 py-0.5 rounded-full", order.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary")}>{statusLabels[order.status]}</span>
                  {order.printedAt && (
                    <span className="text-micro font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{order.printCount > 1 ? `✓ Printed ×${order.printCount}` : "✓ Printed"}</span>
                  )}
                  {shouldShowBilledBadge(order) && (
                    <span className="text-micro font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">Billed</span>
                  )}
                  {shouldShowPackingBadge(order) && (
                    <span className="text-micro font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Packing</span>
                  )}
                </div>
                <p suppressHydrationWarning className="text-caption text-muted-foreground mt-0.5">{order.customerName} • {order.items.length} items • {timeSince(order.createdAt, now)}</p>
                {order.deliveryInstructions && (
                  <p className="text-micro text-amber-600 dark:text-amber-400 mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">📝 {order.deliveryInstructions}</p>
                )}
              </div>
              <p className="text-body font-bold text-foreground shrink-0 mr-2">{formatCurrency(order.total)}</p>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", expandedOrderIds.has(order.id) && "rotate-180")} />
            </button>

            {/* Expandable details */}
            {expandedOrderIds.has(order.id) && (
            <div className="border-t border-border">
              {/* Address bar */}
              <div className="flex items-start gap-2 bg-muted px-4 py-2.5 sm:px-5">
                <span className="mt-0.5 text-muted-foreground shrink-0">📍</span>
                <p className="text-xs font-semibold text-muted-foreground">{order.address}</p>
              </div>
              {order.deliveryInstructions && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 sm:px-5 border-b border-amber-100 dark:border-amber-900/30">
                  <span className="mt-0.5 shrink-0">📝</span>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{order.deliveryInstructions}</p>
                </div>
              )}
              <div className="px-4 pb-5 pt-4 sm:px-5 space-y-4">
              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <a href={`tel:${order.phone}`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-xs font-black text-muted-foreground hover:bg-muted transition-colors">
                  <Phone className="h-3.5 w-3.5 text-blue-500" /> Call
                </a>
                <a href={`https://wa.me/${order.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-xs font-black text-white hover:bg-[#1ebe5d] transition-colors">
                  <Send className="h-3.5 w-3.5" /> WhatsApp
                </a>
                <a href={manualWhatsAppLink(order)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-xs font-black text-muted-foreground hover:bg-muted transition-colors">
                  <Send className="h-3.5 w-3.5 text-primary" /> Manual WA
                </a>
                <a href={`/admin/orders/${order.id}/invoice`} onClick={async (e) => { e.preventDefault(); await fetch(`/api/orders/${order.id}/print`, { method: "POST" }).catch(() => null); window.open(`/admin/orders/${order.id}/invoice`, "_blank"); }} className={cn("inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-black transition-colors", order.printedAt ? "bg-emerald-500 text-white hover:bg-emerald-600" : "border border-border bg-card text-muted-foreground hover:bg-muted")}>
                  <FileText className="h-3.5 w-3.5" />{order.printedAt ? (order.printCount > 1 ? "Duplicate ✓" : "Printed ✓") : "Print"}
                </a>
              </div>
              {order.status === "ORDER_RECEIVED" && !order.acknowledgedAt && (
                <button type="button" disabled={ackLoading === order.id} onClick={() => acknowledgeOrder(order.id)} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                  <BellRing className="h-4 w-4" />{ackLoading === order.id ? "Acknowledging…" : "Acknowledge New Order"}
                </button>
              )}
              {/* Items */}
              <div className="rounded-2xl overflow-hidden border border-border">
                <div className="flex items-center justify-between bg-slate-800 dark:bg-slate-900 px-4 py-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">🛒 Items ({order.items.length})</span>
                  <span className="text-xs font-black text-slate-300">{formatCurrency(order.total)}</span>
                </div>
                <ul className="divide-y divide-border">
                  {order.items.map((item, idx) => {
                    const itemTotal = item.price * item.quantity;
                    const gstRate = item.gstRate ?? 0;
                    const gstAmt = gstRate > 0 ? itemTotal - itemTotal / (1 + gstRate / 100) : 0;
                    const rowBg = ["bg-card","bg-blue-50/50 dark:bg-blue-950/20","bg-emerald-50/50 dark:bg-emerald-950/20","bg-amber-50/50 dark:bg-amber-950/20","bg-purple-50/50 dark:bg-purple-950/20"][idx % 5];
                    return (
                      <li key={item.id} className={cn("flex items-center gap-3 px-4 py-3", rowBg)}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 dark:bg-slate-600 text-sm font-black text-white">{item.quantity}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatQuantityWithUnit(item.quantity, item.unit)}</p>
                          {gstRate > 0 && <p className="text-[11px] text-muted-foreground">GST {gstRate}% · {formatCurrency(gstAmt)}</p>}
                        </div>
                        <span className="shrink-0 text-sm font-black text-foreground">{formatCurrency(itemTotal)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="bg-muted px-4 py-2.5 space-y-1">
                  {(() => { const g = order.items.reduce((s,i) => { const t=i.price*i.quantity,r=i.gstRate??0; return s+(r>0?t-t/(1+r/100):0); },0); return g>0?<div className="flex justify-between text-xs text-muted-foreground"><span>GST (incl.)</span><span>{formatCurrency(g)}</span></div>:null; })()}
                  <div className="flex justify-between text-sm font-black text-foreground pt-1 border-t border-border">
                    <span>Order Total</span><span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
              {/* Edit items */}
              {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                <details className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
                  <summary className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 text-xs font-black text-amber-800 dark:text-amber-300 cursor-pointer hover:bg-amber-100 transition-colors">
                    ✏️ Edit Items (qty / substitute / remove)
                  </summary>
                  <div className="px-4 pb-4 pt-3 space-y-3 bg-card border-t border-amber-100 dark:border-amber-900">
                    {order.items.map((item) => (
                      <div key={item.id} className="rounded-xl bg-muted p-3">
                        <p className="text-xs font-black text-foreground mb-2">{item.name}</p>
                        <div className="grid gap-2 sm:grid-cols-[72px_1fr_1fr]">
                          <input value={editDrafts[item.id]?.quantity ?? item.quantity.toString()} onChange={(e) => updateDraft(item.id, { quantity: e.target.value.replace(/\D/g, "") })} className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" placeholder="Qty" />
                          <select value={editDrafts[item.id]?.productId ?? ""} onChange={(e) => updateDraft(item.id, { productId: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary">
                            <option value="">Substitute…</option>
                            {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>)}
                          </select>
                          <input value={editDrafts[item.id]?.reason ?? ""} onChange={(e) => updateDraft(item.id, { reason: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" placeholder="Reason" />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 mt-2">
                          <button type="button" disabled={editLoading === item.id} onClick={() => editItem(order.id, item.id, "quantity-change")} className="h-8 rounded-lg bg-blue-600 text-[11px] font-black text-white disabled:opacity-50">Qty</button>
                          <button type="button" disabled={editLoading === item.id || !(editDrafts[item.id]?.productId)} onClick={() => editItem(order.id, item.id, "substitute")} className="h-8 rounded-lg bg-amber-500 text-[11px] font-black text-white disabled:opacity-50">Swap</button>
                          <button type="button" disabled={editLoading === item.id} onClick={() => editItem(order.id, item.id, "remove")} className="h-8 rounded-lg bg-red-500 text-[11px] font-black text-white disabled:opacity-50">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              {/* Status */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 overflow-hidden">
                <div className="px-4 py-2 border-b border-primary/10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">Update Status</span>
                </div>
                <div className="p-3">
                  <OrderStatusForm orderId={order.id} currentStatus={order.status} onStatusChange={(status) => updateOrderStatus(order.id, status)} />
                </div>
              </div>
              {/* OTP */}
              {order.deliveryOtp && (
                <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Delivery OTP</p>
                    <p className="mt-1 text-3xl font-black tracking-[0.22em] text-indigo-700 dark:text-indigo-300">{order.deliveryOtp}</p>
                    <p className="mt-0.5 text-[11px] text-indigo-500">{order.deliveryOtpAttempts}/3 attempts{order.deliveryOtpExpiresAt ? ` · expires ${new Date(order.deliveryOtpExpiresAt).toLocaleTimeString("en-IN")}` : ""}</p>
                  </div>
                  <button type="button" onClick={() => regenerateOtp(order.id)} disabled={otpLoading === order.id} className="h-10 rounded-xl bg-indigo-600 px-4 text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-60 shrink-0">
                    {otpLoading === order.id ? "…" : "Regenerate"}
                  </button>
                </div>
              )}
              {/* Staff note */}
              <div className="rounded-2xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 p-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-yellow-700 dark:text-yellow-400">📝 Staff Note</label>
                <textarea value={staffNotes[order.id] ?? ""} onChange={(e) => setStaffNotes((c) => ({ ...c, [order.id]: e.target.value }))} className="mt-2 min-h-16 w-full rounded-xl border border-yellow-200 dark:border-yellow-700 bg-card p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-yellow-400 resize-none" placeholder="Packing note, payment note, customer preference…" />
                <button type="button" onClick={() => saveStaffNote(order)} className="mt-2 h-9 rounded-xl bg-yellow-500 px-4 text-xs font-black text-white hover:bg-yellow-600">Save note</button>
              </div>
              {/* Bill number */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  🧾 Bill Number{billNumberSaving === order.id && <span className="text-primary font-bold normal-case">Saving…</span>}
                </label>
                {order.billNumber ? (
                  <p className="mt-2 text-lg font-black text-foreground">{order.billNumber}</p>
                ) : (
                  <div className="mt-2">
                    <div className="flex gap-2">
                      <input type="text" value={billNumberDrafts[order.id] ?? ""} onChange={(e) => { setBillNumberDrafts((p) => ({ ...p, [order.id]: e.target.value })); setBillNumberErrors((prev) => { const next = { ...prev }; delete next[order.id]; return next; }); }} placeholder="Enter bill number" className={cn("h-10 flex-1 rounded-xl border bg-background px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary", billNumberErrors[order.id] ? "border-red-400 focus:ring-red-400" : "border-border")} />
                      <button type="button" onClick={() => saveBillNumber(order.id)} disabled={billNumberSaving === order.id} className="h-10 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 px-4 text-sm font-black text-white disabled:opacity-50">Save</button>
                    </div>
                    {billNumberErrors[order.id] && (
                      <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">{billNumberErrors[order.id]}</p>
                    )}
                  </div>
                )}
              </div>
              {/* Delivery partner */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  🚴 Delivery Partner{assignLoading === order.id && <span className="text-primary font-bold normal-case">Saving…</span>}
                </label>
                <select value={order.deliveryPartnerId ?? ""} onChange={(e) => assignDelivery(order.id, e.target.value)} disabled={!order.billNumber} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">{order.billNumber ? "Unassigned — tap to assign" : "Enter bill number first"}</option>
                  {deliveryPartners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {/* WhatsApp logs */}
              {order.whatsappLogs.length > 0 && (
                <details className="rounded-2xl border border-border overflow-hidden">
                  <summary className="flex items-center gap-2 px-4 py-3 bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
                    💬 WhatsApp timeline ({order.whatsappLogs.length})
                  </summary>
                  <div className="divide-y divide-border">
                    {order.whatsappLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex flex-wrap justify-between gap-2 px-4 py-2.5 text-xs">
                        <span className="font-bold text-muted-foreground">{log.template}</span>
                        <span className={cn("font-black", log.status === "delivered" ? "text-green-600" : log.status === "failed" ? "text-red-500" : "text-primary")}>{log.status}</span>
                        <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              </div>
            </div>
            )}
          </article>
        ))}
              </div>
            </div>
          ))
        })()}
      </div>
    </>
  );
}
