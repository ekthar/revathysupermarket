"use client";

import { useMemo, useState } from "react";
import { FileText, Phone, Search, Send } from "lucide-react";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { statusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  total: number;
  status: keyof typeof statusLabels;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
};

export function AdminOrdersClient({ orders }: { orders: AdminOrder[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((order) =>
      [order.orderNumber, order.customerName, order.phone, order.address]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [orders, query]);

  return (
    <>
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Staff workflow</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl font-black leading-tight">Orders</h2>
            <p className="mt-2 text-sm text-muted-foreground">Scan, call, update, and print from one screen.</p>
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
      </div>
      <div className="mt-5 grid gap-4">
        {filtered.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border p-10 text-center">No orders found.</div>
        ) : filtered.map((order) => (
          <article key={order.id} className="rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold">#{order.orderNumber}</h3>
                <p className="text-sm text-muted-foreground">{order.customerName} - {order.phone}</p>
                <p className="mt-2 text-sm">{order.address}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black">{formatCurrency(order.total)}</p>
                <p className="mt-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{statusLabels[order.status]}</p>
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
            </div>
            <ul className="mt-4 grid gap-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between rounded-2xl bg-muted p-3">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
          </article>
        ))}
      </div>
    </>
  );
}
