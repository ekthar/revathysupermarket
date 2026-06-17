"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, FileText, Phone, Search, Send } from "lucide-react";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { statusLabels } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  total: number;
  status: keyof typeof statusLabels;
  deliveryPartnerId?: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
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
  const [localOrders, setLocalOrders] = useState(orders);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "new" | "pending" | "packing" | "delivered">("all");
  const [now, setNow] = useState(() => Date.now());
  const [ackLoading, setAckLoading] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, { quantity: string; productId: string; reason: string }>>({});

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
    if (unacknowledgedNewOrders.length === 0) return;

    const originalTitle = document.title;
    let alertTitle = false;
    const titleTimer = window.setInterval(() => {
      alertTitle = !alertTitle;
      document.title = alertTitle ? "New order - Revathy" : originalTitle;
    }, 1000);

    const audioTimer = window.setInterval(() => {
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
  }, [unacknowledgedNewOrders.length]);

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
    setLocalOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
  }

  async function acknowledgeOrder(orderId: string) {
    setAckLoading(orderId);
    const response = await fetch(`/api/admin/orders/${orderId}/acknowledge`, { method: "POST" });
    setAckLoading(null);
    if (!response.ok) return;
    setLocalOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, acknowledgedAt: new Date().toISOString() } : order
    )));
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
    const response = await fetch(`/api/admin/orders/${orderId}/delivery`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryPartnerId: deliveryPartnerId || null })
    });
    setAssignLoading(null);
    if (!response.ok) {
      showToast("Delivery assignment failed", "error");
      return;
    }
    setLocalOrders((current) => current.map((order) => order.id === orderId ? { ...order, deliveryPartnerId: deliveryPartnerId || null } : order));
    showToast("Delivery partner assigned", "success");
  }

  return (
    <>
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Staff workflow</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl font-black leading-tight">Orders</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Scan, call, update, and print from one screen.
              {counts.new > 0 ? <span className="ml-2 font-black text-red-600">{counts.new} new unacknowledged</span> : null}
            </p>
          </div>
          <a href="/api/admin/export/orders" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white">
            <FileText className="h-4 w-4" />
            Export
          </a>
        </div>
        <label className="relative mt-5 block">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-primary" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/70 bg-white/90 pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-slate-900"
            placeholder="Search order number, customer, phone"
          />
        </label>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {[
            ["all", "All", counts.all],
            ["new", "New", counts.new],
            ["pending", "Pending", counts.pending],
            ["packing", "Packing", counts.packing],
            ["delivered", "Delivered", counts.delivered]
          ].map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as typeof tab)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-xs font-black transition active:scale-[0.98]",
                tab === key ? "bg-primary text-white" : "border border-white/70 bg-white/80 text-foreground dark:border-white/10 dark:bg-slate-900"
              )}
            >
              {label} {count}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        {filtered.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border p-10 text-center">No orders found.</div>
        ) : filtered.map((order) => (
          <article
            key={order.id}
            className={cn(
              "rounded-[1.75rem] border bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5",
              order.status === "CANCELLED" ? "border-red-200 bg-red-50/90 dark:border-red-500/30 dark:bg-red-950/25" : "border-white/70"
            )}
          >
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-2xl font-bold">#{order.orderNumber}</h3>
                  {order.status === "ORDER_RECEIVED" && !order.acknowledgedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">
                      <BellRing className="h-3.5 w-3.5" />
                      New
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{order.customerName} - {order.phone}</p>
                <p className="mt-1 text-xs font-black uppercase text-primary">Placed {timeSince(order.createdAt, now)}</p>
                <p className="mt-2 text-sm">{order.address}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black">{formatCurrency(order.total)}</p>
                <p className={cn("mt-1 rounded-full px-3 py-1 text-xs font-black", order.status === "CANCELLED" ? "bg-red-600 text-white" : "bg-primary/10 text-primary")}>{statusLabels[order.status]}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
              <a href={`tel:${order.phone}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 text-sm font-black">
                <Phone className="h-4 w-4 text-primary" />
                Call
              </a>
              <a href={`https://wa.me/${order.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-lime-fresh text-sm font-black text-slate-950">
                <Send className="h-4 w-4" />
                WhatsApp
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
            <ul className="mt-4 grid gap-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="rounded-2xl bg-muted p-3">
                  <div className="flex justify-between gap-3">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  {order.status !== "DELIVERED" && order.status !== "CANCELLED" ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[90px_minmax(0,1fr)_minmax(0,1fr)]">
                      <input
                        value={editDrafts[item.id]?.quantity ?? item.quantity.toString()}
                        onChange={(event) => updateDraft(item.id, { quantity: event.target.value.replace(/\D/g, "") })}
                        className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                        aria-label={`Quantity for ${item.name}`}
                      />
                      <select
                        value={editDrafts[item.id]?.productId ?? ""}
                        onChange={(event) => updateDraft(item.id, { productId: event.target.value })}
                        className="h-10 min-w-0 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                        aria-label={`Substitute for ${item.name}`}
                      >
                        <option value="">Choose substitute</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>{product.name} - {formatCurrency(product.price)}</option>
                        ))}
                      </select>
                      <input
                        value={editDrafts[item.id]?.reason ?? ""}
                        onChange={(event) => updateDraft(item.id, { reason: event.target.value })}
                        className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Reason"
                      />
                      <div className="grid grid-cols-3 gap-2 sm:col-span-3">
                        <button type="button" disabled={editLoading === item.id} onClick={() => editItem(order.id, item.id, "quantity-change")} className="h-10 rounded-xl bg-primary text-xs font-black text-white disabled:opacity-60">Qty</button>
                        <button type="button" disabled={editLoading === item.id || !(editDrafts[item.id]?.productId)} onClick={() => editItem(order.id, item.id, "substitute")} className="h-10 rounded-xl bg-lime-fresh text-xs font-black text-slate-950 disabled:opacity-60">Swap</button>
                        <button type="button" disabled={editLoading === item.id} onClick={() => editItem(order.id, item.id, "remove")} className="h-10 rounded-xl bg-red-600 text-xs font-black text-white disabled:opacity-60">Remove</button>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
            <OrderStatusForm orderId={order.id} currentStatus={order.status} onStatusChange={(status) => updateOrderStatus(order.id, status)} />
            <div className="mt-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                Delivery partner
                {assignLoading === order.id ? <span className="text-primary">Saving</span> : null}
              </label>
              <select
                value={order.deliveryPartnerId ?? ""}
                onChange={(event) => assignDelivery(order.id, event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-border bg-background/70 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Unassigned</option>
                {deliveryPartners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
              </select>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
