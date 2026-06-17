"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, Navigation, Phone, Truck } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";
import { statusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type DeliveryOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  status: keyof typeof statusLabels;
  total: number;
  items: Array<{ id: string; name: string; quantity: number }>;
};

export function DeliveryOrdersClient({ orders }: { orders: DeliveryOrder[] }) {
  const [localOrders, setLocalOrders] = useState(orders);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition((position) => {
      fetch("/api/delivery/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude })
      }).catch(() => null);
    }, undefined, { enableHighAccuracy: true, maximumAge: 10000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  async function updateOrder(order: DeliveryOrder, action: "picked_up" | "delivered") {
    const otp = action === "delivered" ? window.prompt("Enter delivery OTP") ?? "" : undefined;
    const response = await fetch(`/api/delivery/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, otp })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      window.alert(data.error ?? "Delivery update failed.");
      return;
    }
    setLocalOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, status: action === "picked_up" ? "OUT_FOR_DELIVERY" : "DELIVERED" } : entry));
  }

  return (
    <div className="mt-5 grid gap-4">
      {localOrders.length === 0 ? <div className="rounded-[1.75rem] border border-dashed border-border p-10 text-center">No assigned active orders.</div> : localOrders.map((order) => (
        <article key={order.id} className="rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
          <div className="flex justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold">#{order.orderNumber}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{order.customerName}</p>
            </div>
            <p className="h-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{statusLabels[order.status]}</p>
          </div>
          <p className="mt-3 flex gap-2 text-sm"><MapPin className="h-4 w-4 shrink-0 text-primary" />{order.address}</p>
          <p className="mt-2 font-black">{formatCurrency(order.total)}</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {order.items.map((item) => <li key={item.id} className="rounded-2xl bg-muted p-3">{item.name} x {item.quantity}</li>)}
          </ul>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <a href={`tel:${order.phone}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background text-xs font-black"><Phone className="h-4 w-4" />Call</a>
            <button onClick={() => updateOrder(order, "picked_up")} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black text-white"><Truck className="h-4 w-4" />Picked</button>
            <button onClick={() => updateOrder(order, "delivered")} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-lime-fresh text-xs font-black text-slate-950"><CheckCircle2 className="h-4 w-4" />Delivered</button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs font-bold text-muted-foreground"><Navigation className="h-3.5 w-3.5" />Location updates while this page is open.</p>
        </article>
      ))}
    </div>
  );
}
