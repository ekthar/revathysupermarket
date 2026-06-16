"use client";

import { useMemo, useState } from "react";
import { MapPin, Navigation, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/components/cart/cart-provider";
import { calculateDistanceKm } from "@/lib/distance";
import { SITE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";

type CheckoutState = {
  customerName: string;
  phone: string;
  whatsapp: string;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  notes: string;
  paymentMethod: "COD" | "UPI_ON_DELIVERY";
  latitude: string;
  longitude: string;
};

const initialState: CheckoutState = {
  customerName: "",
  phone: "",
  whatsapp: "",
  houseName: "",
  street: "",
  landmark: "",
  pincode: "",
  notes: "",
  paymentMethod: "COD",
  latitude: "",
  longitude: ""
};

export function CheckoutForm() {
  const { items, subtotal, clearCart } = useCart();
  const { showToast } = useToast();
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const distance = useMemo(() => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return calculateDistanceKm({ lat, lng });
  }, [form.latitude, form.longitude]);

  const isOutsideRadius = distance !== null && distance > SITE.deliveryRadiusKm;

  function update(name: keyof CheckoutState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Location access is not available on this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update("latitude", position.coords.latitude.toString());
        update("longitude", position.coords.longitude.toString());
      },
      () => setMessage("Unable to read location. Enter latitude and longitude manually.")
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (items.length === 0) {
      setMessage("Your cart is empty.");
      showToast("Your cart is empty", "error");
      return;
    }
    if (isOutsideRadius) {
      setMessage("Sorry, delivery is currently available only within 5 KM of Revathy Supermarket.");
      showToast("Delivery is available only within 5 KM", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          items: items.map((item) => ({
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.discountPrice ?? item.price
          }))
        })
      });

      const data = await readApiResponse<{ error?: string; orderNumber?: string; whatsappUrl?: string }>(response);
      setIsSubmitting(false);

      if (!response.ok) {
        setMessage(data.error ?? "Order could not be placed.");
        showToast(data.error ?? "Order could not be placed", "error");
        return;
      }

      clearCart();
      if (data.whatsappUrl) {
        setWhatsappUrl(data.whatsappUrl);
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      showToast("Order placed successfully", "success");
      setMessage(`Order #${data.orderNumber} placed. WhatsApp is opening with the order details.`);
    } catch {
      setIsSubmitting(false);
      setMessage("Order could not be placed. Please check your connection and try again.");
      showToast("Order could not be placed", "error");
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="grid gap-4 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:grid-cols-2 sm:p-5">
        <div className="sm:col-span-2">
          <h2 className="font-display text-2xl font-black">Delivery details</h2>
          <p className="mt-1 text-sm text-muted-foreground">Store staff will use these details to confirm and deliver your order.</p>
        </div>
        {[
          ["customerName", "Customer Name"],
          ["phone", "Phone Number"],
          ["whatsapp", "WhatsApp Number"],
          ["houseName", "House Name"],
          ["street", "Street"],
          ["landmark", "Landmark"],
          ["pincode", "Pincode"],
          ["latitude", "Latitude"],
          ["longitude", "Longitude"]
        ].map(([name, label]) => (
          <label key={name} className={name === "street" ? "sm:col-span-2" : ""}>
            <span className="text-sm font-bold">{label}</span>
            <Input
              required={name !== "latitude" && name !== "longitude" ? true : true}
              value={form[name as keyof CheckoutState]}
              onChange={(event) => update(name as keyof CheckoutState, event.target.value)}
              className="mt-2 h-12 rounded-2xl bg-background/80"
            />
          </label>
        ))}
        <label className="sm:col-span-2">
          <span className="text-sm font-bold">Notes</span>
          <Textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} className="mt-2 rounded-2xl bg-background/80" />
        </label>
        <div className="sm:col-span-2">
          <Button type="button" variant="outline" onClick={useCurrentLocation} className="w-full sm:w-auto">
            <Navigation className="h-4 w-4" />
            Use current location
          </Button>
          {distance !== null && (
            <p className={isOutsideRadius ? "mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600" : "mt-3 rounded-2xl bg-primary/10 p-3 text-sm font-bold text-primary"}>
              {isOutsideRadius
                ? "Sorry, delivery is currently available only within 5 KM of Revathy Supermarket."
                : `Distance from store: ${distance.toFixed(2)} KM`}
            </p>
          )}
        </div>
      </section>

      <aside className="sticky bottom-24 h-fit rounded-[1.75rem] border border-white/70 bg-card/95 p-5 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.75)] dark:border-white/10 lg:top-24">
        <h2 className="font-display text-2xl font-bold">Payment</h2>
        <div className="mt-4 grid gap-3">
          <label className={form.paymentMethod === "COD" ? "flex cursor-pointer items-center gap-3 rounded-2xl border border-primary bg-primary/10 p-4" : "flex cursor-pointer items-center gap-3 rounded-2xl border border-border p-4"}>
            <input type="radio" checked={form.paymentMethod === "COD"} onChange={() => update("paymentMethod", "COD")} />
            <span className="font-bold">Cash on Delivery</span>
          </label>
          <label className={form.paymentMethod === "UPI_ON_DELIVERY" ? "flex cursor-pointer items-center gap-3 rounded-2xl border border-primary bg-primary/10 p-4" : "flex cursor-pointer items-center gap-3 rounded-2xl border border-border p-4"}>
            <input type="radio" checked={form.paymentMethod === "UPI_ON_DELIVERY"} onChange={() => update("paymentMethod", "UPI_ON_DELIVERY")} />
            <span className="font-bold">UPI on Delivery</span>
          </label>
        </div>
        <div className="mt-5 rounded-2xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
          <MapPin className="mb-2 h-4 w-4 text-primary" />
          Orders are manually confirmed by Revathy Supermarket before delivery.
        </div>
        <div className="mt-5 border-t border-border pt-5">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
        {message && <p className="mt-4 rounded-xl bg-muted p-3 text-sm font-medium">{message}</p>}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block rounded-xl bg-lime-fresh p-3 text-center text-sm font-black text-slate-950"
          >
            Open WhatsApp order message
          </a>
        )}
        <Button className="mt-5 w-full" size="lg" disabled={isSubmitting || isOutsideRadius || items.length === 0}>
          <Send className="h-4 w-4" />
          {isSubmitting ? "Placing order" : "Place order"}
        </Button>
      </aside>
    </form>
  );
}
