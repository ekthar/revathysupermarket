"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronDown, Home, LocateFixed, MapPin, Navigation, PartyPopper, Phone, Send, WalletCards } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/components/cart/cart-provider";
import { calculateDistanceKm } from "@/lib/distance";
import { SITE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
import { isServiceablePincode, serviceablePincodes } from "@/lib/delivery";
import type { StoreSettings } from "@/lib/store-settings";
import { OrderBillCard } from "@/components/order-bill-card";
import { Confetti } from "@/components/ui/confetti";

type CheckoutState = {
  customerName: string;
  phone: string;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  notes: string;
  paymentMethod: "COD" | "UPI_ON_DELIVERY";
  latitude: string;
  longitude: string;
};

type LocationState = "idle" | "loading" | "success" | "denied";
type SavedAddress = {
  id: string;
  label: string;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
};

const initialState: CheckoutState = {
  customerName: "",
  phone: "",
  houseName: "",
  street: "",
  landmark: "",
  pincode: "",
  notes: "",
  paymentMethod: "COD",
  latitude: "",
  longitude: ""
};

const sectionMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 }
};

export function CheckoutForm({
  deliveryRadiusKm = SITE.deliveryRadiusKm,
  allowedPincodes = serviceablePincodes(),
  savedAddresses = []
}: {
  deliveryRadiusKm?: number;
  allowedPincodes?: StoreSettings["serviceablePincodes"];
  savedAddresses?: SavedAddress[];
}) {
  const { items, subtotal, clearCart } = useCart();
  const { showToast } = useToast();
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [showManualLocation, setShowManualLocation] = useState(false);

  const distance = useMemo(() => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !form.latitude || !form.longitude) return null;
    return calculateDistanceKm({ lat, lng });
  }, [form.latitude, form.longitude]);

  const pincodeReady = /^\d{6}$/.test(form.pincode);
  const pincodeOk = pincodeReady && isServiceablePincode(form.pincode, allowedPincodes);
  const isOutsideRadius = distance !== null && distance > deliveryRadiusKm;
  const locationOk = distance !== null && !isOutsideRadius;
  const canSubmit = items.length > 0 && pincodeOk && locationOk && !isSubmitting;

  useEffect(() => {
    if (!placedOrderId) return;
    const timeout = window.setTimeout(() => {
      window.location.href = "/dashboard";
    }, 3500);
    return () => window.clearTimeout(timeout);
  }, [placedOrderId]);

  function update(name: keyof CheckoutState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function applySavedAddress(addressId: string) {
    const address = savedAddresses.find((entry) => entry.id === addressId);
    if (!address) return;
    setForm((current) => ({
      ...current,
      houseName: address.houseName,
      street: address.street,
      landmark: address.landmark,
      pincode: address.pincode,
      latitude: address.latitude.toString(),
      longitude: address.longitude.toString()
    }));
    setLocationState("success");
    showToast(`${address.label} address selected`, "success");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationState("denied");
      setMessage("Location access is not available on this browser.");
      showToast("Location is not available", "error");
      return;
    }

    setLocationState("loading");
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update("latitude", position.coords.latitude.toString());
        update("longitude", position.coords.longitude.toString());
        setLocationState("success");
        showToast("Location detected", "success");
      },
      () => {
        setLocationState("denied");
        setMessage("Unable to read location. Please allow location access or enter coordinates manually.");
        showToast("Location permission needed", "error");
      },
      { enableHighAccuracy: true, timeout: 12000 }
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
    if (!pincodeOk) {
      setMessage("Sorry, this pincode is not currently serviceable by Revathy Supermarket.");
      showToast("Pincode is outside delivery area", "error");
      return;
    }
    if (!locationOk) {
      setMessage(isOutsideRadius ? `Sorry, delivery is currently available only within ${deliveryRadiusKm} KM of Revathy Supermarket.` : "Please verify your GPS location before placing the order.");
      showToast("Location verification required", "error");
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

      const data = await readApiResponse<{ error?: string; orderId?: string; orderNumber?: string }>(response);
      setIsSubmitting(false);

      if (!response.ok) {
        setMessage(data.error ?? "Order could not be placed.");
        showToast(data.error ?? "Order could not be placed", "error");
        return;
      }

      clearCart();
      if (data.orderId) setPlacedOrderId(data.orderId);
      showToast("Order placed successfully", "success");
      setMessage(`Order #${data.orderNumber} placed. Confirmation will arrive on WhatsApp.`);
    } catch {
      setIsSubmitting(false);
      setMessage("Order could not be placed. Please check your connection and try again.");
      showToast("Order could not be placed", "error");
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid min-w-0 gap-5 pb-28 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-0">
      {placedOrderId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/92 px-4 backdrop-blur">
          <Confetti />
          <div className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-card/95 p-6 text-center shadow-premium dark:border-white/10">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-lime-fresh text-slate-950">
              <PartyPopper className="h-10 w-10" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-black">Order placed</h2>
            <p className="mt-2 text-sm font-bold text-muted-foreground">WhatsApp confirmation is being sent. You will be taken to My Orders.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button asChild type="button" variant="outline">
                <Link href={`/api/orders/${placedOrderId}/bill`}>View bill data</Link>
              </Button>
              <Button asChild type="button">
                <Link href="/dashboard">Track order</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="grid min-w-0 gap-5">
        <CheckoutSection icon={Phone} eyebrow="Step 1" title="Contact details">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <Field label="Customer name" value={form.customerName} onChange={(value) => update("customerName", value)} />
            <Field label="Phone number" type="tel" value={form.phone} onChange={(value) => update("phone", value)} />
          </div>
        </CheckoutSection>

        <CheckoutSection icon={Home} eyebrow="Step 2" title="Delivery address">
          {savedAddresses.length > 0 ? (
            <label className="mb-3 block">
              <span className="text-sm font-bold">Saved address</span>
              <select
                defaultValue=""
                onChange={(event) => applySavedAddress(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-border bg-background/80 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose saved address</option>
                {savedAddresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label}{address.isDefault ? " (default)" : ""} - {address.houseName}, {address.pincode}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <Field label="House name / flat" value={form.houseName} onChange={(value) => update("houseName", value)} />
            <Field label="Pincode" inputMode="numeric" value={form.pincode} onChange={(value) => update("pincode", value.replace(/\D/g, "").slice(0, 6))} />
            <Field label="Street / area" value={form.street} onChange={(value) => update("street", value)} className="sm:col-span-2" />
            <Field label="Landmark" value={form.landmark} onChange={(value) => update("landmark", value)} className="sm:col-span-2" />
          </div>
          <AnimatePresence mode="wait">
            {pincodeReady && (
              <motion.p
                key={pincodeOk ? "pin-ok" : "pin-bad"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={pincodeOk ? "mt-3 rounded-2xl bg-primary/10 p-3 text-sm font-bold text-primary" : "mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600"}
              >
                {pincodeOk ? "This pincode is serviceable." : `Not serviceable yet. Current pincodes: ${allowedPincodes.join(", ")}`}
              </motion.p>
            )}
          </AnimatePresence>
          <label className="mt-3 block">
            <span className="text-sm font-bold">Delivery notes</span>
            <Textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} className="mt-2 rounded-2xl bg-background/80" placeholder="Gate color, preferred time, substitutions..." />
          </label>
        </CheckoutSection>

        <CheckoutSection icon={LocateFixed} eyebrow="Step 3" title="Verify location">
          <div className="min-w-0 rounded-[1.5rem] border border-border bg-background/70 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {locationOk ? <CheckCircle2 className="h-5 w-5" /> : <Navigation className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black">GPS location required</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  We verify your exact distance from Revathy Supermarket. Delivery is available within {deliveryRadiusKm} KM only.
                </p>
              </div>
            </div>
            <Button type="button" variant={locationOk ? "secondary" : "default"} onClick={useCurrentLocation} disabled={locationState === "loading"} className="mt-4 w-full">
              <Navigation className="h-4 w-4" />
              {locationState === "loading" ? "Finding your location" : locationOk ? "Refresh location" : "Use my current location"}
            </Button>
            {distance !== null && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={isOutsideRadius ? "mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600" : "mt-3 rounded-2xl bg-primary/10 p-3 text-sm font-bold text-primary"}
              >
                {isOutsideRadius
                  ? `Sorry, delivery is currently available only within ${deliveryRadiusKm} KM of Revathy Supermarket.`
                  : `Distance from store: ${distance.toFixed(2)} KM`}
              </motion.p>
            )}
            {locationState === "denied" && (
              <p className="mt-3 flex gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Please allow browser location access, then retry.
              </p>
            )}
            <button type="button" onClick={() => setShowManualLocation((current) => !current)} className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-black text-primary">
              Enter coordinates manually
              <ChevronDown className={showManualLocation ? "h-4 w-4 rotate-180 transition" : "h-4 w-4 transition"} />
            </button>
            <AnimatePresence>
              {showManualLocation && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                    <Field label="Latitude" value={form.latitude} onChange={(value) => update("latitude", value)} />
                    <Field label="Longitude" value={form.longitude} onChange={(value) => update("longitude", value)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CheckoutSection>
      </div>

      <motion.aside
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-fit min-w-0 rounded-[1.75rem] border border-white/70 bg-card/95 p-5 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.75)] dark:border-white/10 lg:sticky lg:top-24"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <WalletCards className="h-5 w-5" />
          </span>
          <h2 className="font-display text-2xl font-bold">Payment</h2>
        </div>
        <div className="mt-4 grid gap-3">
          <PaymentCard active={form.paymentMethod === "COD"} label="Cash on Delivery" onClick={() => update("paymentMethod", "COD")} />
          <PaymentCard active={form.paymentMethod === "UPI_ON_DELIVERY"} label="UPI on Delivery" onClick={() => update("paymentMethod", "UPI_ON_DELIVERY")} />
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
          <div className="mt-2 flex justify-between text-xs font-bold text-muted-foreground">
            <span>Items</span>
            <span>{items.length}</span>
          </div>
        </div>
        {message && <p className="mt-4 rounded-xl bg-muted p-3 text-sm font-medium">{message}</p>}
        {placedOrderId && <OrderBillCard orderId={placedOrderId} />}
        <Button className="mt-5 w-full" size="lg" disabled={!canSubmit}>
          <Send className="h-4 w-4" />
          {isSubmitting ? "Placing order" : "Place order"}
        </Button>
        {!canSubmit && (
          <p className="mt-3 text-center text-xs font-bold text-muted-foreground">
            Complete cart, pincode, and GPS verification to place order.
          </p>
        )}
      </motion.aside>
    </form>
  );
}

function CheckoutSection({
  icon: Icon,
  eyebrow,
  title,
  children
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      {...sectionMotion}
      className="min-w-0 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black uppercase text-primary">{eyebrow}</p>
          <h2 className="font-display text-2xl font-black">{title}</h2>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  className
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
}) {
  return (
    <label className={`min-w-0 ${className ?? ""}`}>
      <span className="text-sm font-bold">{label}</span>
      <Input
        required
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 rounded-2xl bg-background/80"
      />
    </label>
  );
}

function PaymentCard({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  const description = label === "Cash on Delivery" ? "Pay with cash when order arrives" : "Pay via UPI/GPay to delivery partner";
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "flex items-center gap-3 rounded-2xl border border-primary bg-primary/10 p-4 text-left" : "flex items-center gap-3 rounded-2xl border border-border p-4 text-left"}
    >
      <span className={active ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white" : "h-5 w-5 rounded-full border border-border"}>{active && <CheckCircle2 className="h-3.5 w-3.5" />}</span>
      <span>
        <span className="block font-bold">{label}</span>
        <span className="mt-1 block text-xs font-semibold text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
