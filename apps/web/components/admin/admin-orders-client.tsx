"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, ChevronDown, FileText, Phone, Send } from "lucide-react";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { statusLabels } from "@/lib/constants";
import { SITE } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
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
  staffNote?: string | null;
  billNumber?: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number; price: number; gstRate: number | null }>;
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
  deliveryPartners
}: {
  orders: AdminOrder[];
  products: AdminProduct[];
  deliveryPartners: DeliveryPartner[];
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
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(() => {
    // Only expand undelivered/uncancelled orders. Delivered = collapsed by default
    const active = new Set<string>();
    for (const order of orders) {
      if (!["DELIVERED", "CANCELLED"].includes(order.status)) {
        active.add(order.id);
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
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
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
        const audioContext = new BrowserAudioContext();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.frequency.value = 880;
        gain.gain.value = 0.04;
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        window.setTimeout(() => {
          oscillator.stop();
          audioContext.close();
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
    window.location.reload();
  }

  function updateDraft(itemId: string, patch: Partial<{ quantity: string; productId: string; reason: string }>) {
    setEditDrafts((current) => ({
      ...current,
      [itemId]: {
        quantity: current[itemId]?.quantity ?? "",
        productId: current[itemId]?.productId ?? "",
        reason: current[itemId]?.reason ?? "",
        ...patch
      }
    }));
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
      showToast("Enter a bill number", "error");
      return;
    }
    setBillNumberSaving(orderId);
    const response = await fetch(`/api/admin/orders/${orderId}/bill-number`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billNumber }),
    });
    const data = await readApiResponse<{ error?: string; order?: { id: string; billNumber: string } }>(response);
    setBillNumberSaving(null);
    if (!response.ok) {
      showToast(data.error ?? "Failed to save bill number", "error");
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
      {view === "board" && <OrderListBoard
        orders={localOrders}
        now={now}
        onSelectOrder={(orderNumber) => { setQuery(orderNumber); setView("list"); }}
      />}
      <div className={cn("mt-5 grid gap-4", view === "board" && "hidden")}>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">No orders found.</div>
        ) : filtered.map((order) => (
          <article
            key={order.id}
            className={cn(
              "rounded-xl border bg-card/95 overflow-hidden shadow-soft dark:border-white/10",
              order.status === "CANCELLED" ? "border-red-200 bg-red-50/90 dark:border-red-500/30 dark:bg-red-950/25" : "border-white/70"
            )}
          >
            {/* Collapsible header - always visible */}
            <button
              type="button"
              onClick={() => toggleOrderExpand(order.id)}
              className="w-full text-left px-4 py-3.5 flex items-center gap-3 sm:px-5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-title font-bold text-slate-900">#{order.orderNumber}</h3>
                  {order.status === "ORDER_RECEIVED" && !order.acknowledgedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-micro font-bold text-white">
                      <BellRing className="h-3 w-3" /> New
                    </span>
                  ) : null}
                  <span className={cn("text-micro font-bold px-2 py-0.5 rounded-full", order.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary")}>{statusLabels[order.status]}</span>
                </div>
                <p suppressHydrationWarning className="text-caption text-slate-500 mt-0.5">{order.customerName} • {order.items.length} items • {timeSince(order.createdAt, now)}</p>
              </div>
              <p className="text-body font-bold text-slate-900 shrink-0 mr-2">{formatCurrency(order.total)}</p>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 transition-transform", expandedOrderIds.has(order.id) && "rotate-180")} />
            </button>

            {/* Expandable details */}
            {expandedOrderIds.has(order.id) && (
            <div className="px-4 pb-4 border-t border-slate-100 pt-3 sm:px-5">
              <p className="text-sm text-muted-foreground">{order.address}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
              <a href={`tel:${order.phone}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 text-sm font-black">
                <Phone className="h-4 w-4 text-primary" />
                Call
              </a>
              <a href={`https://wa.me/${order.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-lime-fresh text-sm font-black text-slate-950">
                <Send className="h-4 w-4" />
                WhatsApp
              </a>
              <a href={manualWhatsAppLink(order)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 text-sm font-black">
                <Send className="h-4 w-4 text-primary" />
                Manual send
              </a>
              <a href={`/admin/orders/${order.id}/invoice`} className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 text-sm font-black sm:col-span-1">
                <FileText className="h-4 w-4 text-primary" />
                Print invoice
              </a>
              {order.status === "ORDER_RECEIVED" && !order.acknowledgedAt ? (
                <button
                  type="button"
                  disabled={ackLoading === order.id}
                  onClick={() => acknowledgeOrder(order.id)}
                  className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white disabled:opacity-60 sm:col-span-1"
                >
                  <BellRing className="h-4 w-4" />
                  {ackLoading === order.id ? "Acknowledging" : "Acknowledge"}
                </button>
              ) : null}
            </div>
            <ul className="mt-4 grid gap-1.5 text-sm">
              {order.items.map((item) => {
                const itemTotal = item.price * item.quantity;
                const gstRate = item.gstRate ?? 0;
                const gstAmt = gstRate > 0 ? itemTotal - itemTotal / (1 + gstRate / 100) : 0;
                return (
                  <li key={item.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/60">
                    <div>
                      <span className="text-body text-slate-700 dark:text-slate-300">{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                      {gstRate > 0 && <span className="ml-2 text-micro text-slate-400">({gstRate}% GST: {formatCurrency(gstAmt)})</span>}
                    </div>
                    <span className="text-body font-semibold text-slate-900 dark:text-white">{formatCurrency(itemTotal)}</span>
                  </li>
                );
              })}
              {(() => {
                const totalGst = order.items.reduce((sum, item) => {
                  const itemTotal = item.price * item.quantity;
                  const rate = item.gstRate ?? 0;
                  return sum + (rate > 0 ? itemTotal - itemTotal / (1 + rate / 100) : 0);
                }, 0);
                return totalGst > 0 ? (
                  <li className="flex items-center justify-between px-3 py-1.5 text-caption text-slate-500">
                    <span>GST (inclusive)</span>
                    <span>{formatCurrency(totalGst)}</span>
                  </li>
                ) : null;
              })()}
              <li className="flex items-center justify-between px-3 py-2 border-t border-border mt-1">
                <span className="text-body font-bold text-slate-900 dark:text-white">Total</span>
                <span className="text-body font-bold text-slate-900 dark:text-white">{formatCurrency(order.total)}</span>
              </li>
            </ul>
            {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
              <details className="mt-3 rounded-xl border border-border overflow-hidden">
                <summary className="px-3 py-2.5 text-caption font-bold text-primary cursor-pointer hover:bg-primary/5 transition-colors">
                  Edit Items (qty / substitute / remove)
                </summary>
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-xl bg-muted/40 p-2.5">
                      <p className="text-caption font-semibold text-slate-800 dark:text-slate-200 mb-2">{item.name}</p>
                      <div className="grid gap-2 sm:grid-cols-[80px_1fr_1fr]">
                        <input
                          value={editDrafts[item.id]?.quantity ?? item.quantity.toString()}
                          onChange={(event) => updateDraft(item.id, { quantity: event.target.value.replace(/\D/g, "") })}
                          className="h-9 rounded-lg border border-border bg-background px-2.5 text-caption font-bold outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Qty"
                        />
                        <select
                          value={editDrafts[item.id]?.productId ?? ""}
                          onChange={(event) => updateDraft(item.id, { productId: event.target.value })}
                          className="h-9 rounded-lg border border-border bg-background px-2.5 text-caption font-semibold outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Substitute...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.name} - {formatCurrency(product.price)}</option>
                          ))}
                        </select>
                        <input
                          value={editDrafts[item.id]?.reason ?? ""}
                          onChange={(event) => updateDraft(item.id, { reason: event.target.value })}
                          className="h-9 rounded-lg border border-border bg-background px-2.5 text-caption font-bold outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Reason"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        <button type="button" disabled={editLoading === item.id} onClick={() => editItem(order.id, item.id, "quantity-change")} className="h-8 rounded-lg bg-primary text-micro font-bold text-white disabled:opacity-50">Qty</button>
                        <button type="button" disabled={editLoading === item.id || !(editDrafts[item.id]?.productId)} onClick={() => editItem(order.id, item.id, "substitute")} className="h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-micro font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50">Swap</button>
                        <button type="button" disabled={editLoading === item.id} onClick={() => editItem(order.id, item.id, "remove")} className="h-8 rounded-lg bg-red-500 text-micro font-bold text-white disabled:opacity-50">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
            <OrderStatusForm orderId={order.id} currentStatus={order.status} onStatusChange={(status) => updateOrderStatus(order.id, status)} />
            {order.deliveryOtp ? (
              <div className="mt-4 grid gap-3 rounded-2xl bg-primary/10 p-3 text-primary sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs font-black uppercase">Delivery OTP</p>
                  <p className="mt-1 text-2xl font-black tracking-[0.18em]">{order.deliveryOtp}</p>
                  <p className="mt-1 text-xs font-bold">
                    Attempts {order.deliveryOtpAttempts}/3
                    {order.deliveryOtpExpiresAt ? ` - expires ${new Date(order.deliveryOtpExpiresAt).toLocaleTimeString("en-IN")}` : ""}
                  </p>
                </div>
                <button type="button" onClick={() => regenerateOtp(order.id)} disabled={otpLoading === order.id} className="h-11 rounded-2xl bg-primary px-4 text-xs font-black text-white disabled:opacity-60">
                  {otpLoading === order.id ? "Regenerating" : "Regenerate OTP"}
                </button>
              </div>
            ) : null}
            <div className="mt-4 rounded-2xl bg-muted p-3">
              <label className="text-xs font-black uppercase text-muted-foreground">Internal staff note</label>
              <textarea
                value={staffNotes[order.id] ?? ""}
                onChange={(event) => setStaffNotes((current) => ({ ...current, [order.id]: event.target.value }))}
                className="mt-2 min-h-20 w-full rounded-2xl border border-border bg-background p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                placeholder="Packing note, payment note, customer preference..."
              />
              <button type="button" onClick={() => saveStaffNote(order)} className="mt-2 h-10 rounded-2xl bg-primary px-4 text-xs font-black text-white">Save note</button>
            </div>
            {order.whatsappLogs.length > 0 ? (
              <div className="mt-4 rounded-2xl bg-muted p-3">
                <p className="text-xs font-black uppercase text-muted-foreground">WhatsApp timeline</p>
                <div className="mt-2 grid gap-2">
                  {order.whatsappLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-background/70 px-3 py-2 text-xs font-bold">
                      <span>{log.template}</span>
                      <span className="text-primary">{log.status}</span>
                      <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                Bill number
                {billNumberSaving === order.id ? <span className="text-primary">Saving</span> : null}
              </label>
              {order.billNumber ? (
                <p className="mt-1 text-sm font-bold text-foreground">{order.billNumber}</p>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={billNumberDrafts[order.id] ?? ""}
                    onChange={(event) => setBillNumberDrafts((prev) => ({ ...prev, [order.id]: event.target.value }))}
                    placeholder="Enter bill number"
                    className="h-11 flex-1 rounded-2xl border border-border bg-background/70 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => saveBillNumber(order.id)}
                    disabled={billNumberSaving === order.id}
                    className="h-11 rounded-2xl bg-primary px-4 text-sm font-black text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                Delivery partner
                {assignLoading === order.id ? <span className="text-primary">Saving</span> : null}
              </label>
              <select
                value={order.deliveryPartnerId ?? ""}
                onChange={(event) => assignDelivery(order.id, event.target.value)}
                disabled={!order.billNumber}
                className="mt-2 h-11 w-full rounded-2xl border border-border bg-background/70 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{order.billNumber ? "Unassigned" : "Enter bill number first"}</option>
                {deliveryPartners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
              </select>
            </div>
            </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
