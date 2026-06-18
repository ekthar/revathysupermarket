"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronRight, CreditCard, Home, LocateFixed, MapPin, Navigation, Phone, Plus, Send, Smartphone, Wallet } from "lucide-react";
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

  const deliveryFee = subtotal > 500 ? 0 : 40;
  const tax = Math.round(subtotal * 0.02);
  const totalAmount = subtotal + deliveryFee + tax;

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
    }, 4000);
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
      setMessage("Sorry, this pincode is not currently serviceable.");
      showToast("Pincode is outside delivery area", "error");
      return;
    }
    if (!locationOk) {
      setMessage(isOutsideRadius ? `Sorry, delivery is currently available only within ${deliveryRadiusKm} KM.` : "Please verify your GPS location before placing the order.");
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
    } catch {
      setIsSubmitting(false);
      setMessage("Order could not be placed. Please check your connection and try again.");
      showToast("Order could not be placed", "error");
    }
  }

  return (
    <form onSubmit={submit} className="max-w-5xl mx-auto px-4 pt-2 pb-32 md:pb-8">
      {/* Order Success Modal */}
      <AnimatePresence>
        {placedOrderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="success-modal-overlay"
          >
            <Confetti />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="success-modal"
            >
              {/* Checkmark icon */}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  <Check className="h-10 w-10 text-white" strokeWidth={3} />
                </motion.div>
              </div>

              <h2 className="mt-6 font-display text-2xl font-black text-slate-900">Order Successful!</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                We&apos;re preparing your order. See updates in My Orders.
              </p>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/"
                  className="flex h-[48px] items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white press"
                >
                  Go Home
                </Link>
                <Link
                  href="/dashboard"
                  className="flex h-[48px] items-center justify-center rounded-full border-2 border-slate-200 text-sm font-bold text-slate-700 press"
                >
                  Track your order
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between py-3 md:hidden">
        <div className="flex items-center gap-3">
          <Link href="/cart" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 press">
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Link>
          <h1 className="text-lg font-black text-slate-900">Checkout</h1>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:gap-8">
        {/* Left column - Forms */}
        <div className="space-y-5">
          {/* Payment Method */}
          <section className="bg-white rounded-2xl p-5 card-elevated">
            <h2 className="text-[15px] font-black text-slate-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              <PaymentMethodCard
                active={form.paymentMethod === "COD"}
                icon={<Wallet className="h-5 w-5" />}
                iconBg="bg-green-100 text-green-700"
                label="Cash on Delivery"
                description="Pay with cash when order arrives"
                onClick={() => update("paymentMethod", "COD")}
              />
              <PaymentMethodCard
                active={form.paymentMethod === "UPI_ON_DELIVERY"}
                icon={<Smartphone className="h-5 w-5" />}
                iconBg="bg-blue-100 text-blue-700"
                label="UPI on Delivery"
                description="Pay via UPI/GPay to delivery partner"
                onClick={() => update("paymentMethod", "UPI_ON_DELIVERY")}
              />
            </div>
            <button type="button" className="mt-4 flex items-center gap-2 w-full justify-center text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors py-2">
              <Plus className="h-3.5 w-3.5" />
              Add Payment Method
            </button>
          </section>

          {/* Delivery Address */}
          <section className="bg-white rounded-2xl p-5 card-elevated">
            <h2 className="text-[15px] font-black text-slate-900 mb-4">Delivery Address</h2>

            {savedAddresses.length > 0 && (
              <div className="mb-4">
                <select
                  defaultValue=""
                  onChange={(event) => applySavedAddress(event.target.value)}
                  className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Choose saved address</option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label}{address.isDefault ? " (default)" : ""} - {address.houseName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Location detection */}
            <div className="rounded-2xl bg-slate-50 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${locationOk ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
                  {locationOk ? <CheckCircle2 className="h-5 w-5" /> : <Navigation className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800">
                    {locationOk ? `${distance?.toFixed(1)} KM from store` : "GPS verification needed"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Delivery within {deliveryRadiusKm} KM only
                  </p>
                </div>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locationState === "loading"}
                  className="shrink-0 px-3 py-2 rounded-full bg-primary text-white text-[11px] font-bold press"
                >
                  {locationState === "loading" ? "Finding..." : locationOk ? "Refresh" : "Detect"}
                </button>
              </div>
              {isOutsideRadius && (
                <p className="mt-3 text-[11px] font-semibold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Outside delivery radius ({distance?.toFixed(1)} KM)
                </p>
              )}
              {locationState === "denied" && (
                <p className="mt-3 text-[11px] font-semibold text-amber-600 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Allow browser location access, then retry
                </p>
              )}
            </div>

            {/* Address fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <CheckoutField label="Customer name" value={form.customerName} onChange={(v) => update("customerName", v)} />
              <CheckoutField label="Phone number" type="tel" value={form.phone} onChange={(v) => update("phone", v)} />
              <CheckoutField label="House name / flat" value={form.houseName} onChange={(v) => update("houseName", v)} />
              <CheckoutField label="Pincode" inputMode="numeric" value={form.pincode} onChange={(v) => update("pincode", v.replace(/\D/g, "").slice(0, 6))} />
              <CheckoutField label="Street / area" value={form.street} onChange={(v) => update("street", v)} className="sm:col-span-2" />
              <CheckoutField label="Landmark" value={form.landmark} onChange={(v) => update("landmark", v)} className="sm:col-span-2" />
            </div>

            <AnimatePresence mode="wait">
              {pincodeReady && (
                <motion.p
                  key={pincodeOk ? "ok" : "bad"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`mt-3 rounded-xl px-3 py-2 text-[12px] font-semibold ${pincodeOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
                >
                  {pincodeOk ? "Pincode is serviceable" : `Not serviceable. Available: ${allowedPincodes.join(", ")}`}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-3">
              <label className="block">
                <span className="text-[12px] font-bold text-slate-600">Delivery notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-[13px] outline-none resize-none h-20 focus:border-primary/40"
                  placeholder="Gate color, preferred time, substitutions..."
                />
              </label>
            </div>

            {/* Manual coordinates toggle */}
            <button
              type="button"
              onClick={() => setShowManualLocation((c) => !c)}
              className="mt-3 text-[12px] font-bold text-primary flex items-center gap-1"
            >
              Enter coordinates manually
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showManualLocation ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showManualLocation && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <CheckoutField label="Latitude" value={form.latitude} onChange={(v) => update("latitude", v)} />
                    <CheckoutField label="Longitude" value={form.longitude} onChange={(v) => update("longitude", v)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Right column - Order Summary */}
        <div className="lg:sticky lg:top-[90px] h-fit">
          <section className="bg-white rounded-2xl p-5 card-elevated">
            <h2 className="text-[15px] font-black text-slate-900">Order Summary</h2>

            {/* Items list preview */}
            <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-600 truncate flex-1 mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-semibold text-slate-800 shrink-0">{formatCurrency((item.discountPrice ?? item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Summary lines */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Amount</span>
                <span className="font-semibold text-slate-700">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery</span>
                <span className="font-semibold text-slate-700">
                  {deliveryFee === 0 ? <span className="text-green-600">FREE</span> : formatCurrency(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                <span className="font-semibold text-slate-700">{formatCurrency(tax)}</span>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between">
                <span className="font-black text-slate-900">Total Amount</span>
                <span className="font-black text-slate-900 text-[16px]">
                  <span className="text-primary">₹</span> {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {message && (
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[12px] font-medium text-slate-600">{message}</p>
            )}

            {/* Pay Now button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-5 flex h-[50px] w-full items-center justify-center rounded-full bg-slate-900 text-white text-[14px] font-bold press shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {isSubmitting ? "Placing order..." : "Pay Now"}
            </button>

            {!canSubmit && (
              <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
                Complete address, pincode & GPS verification to proceed
              </p>
            )}
          </section>
        </div>
      </div>
    </form>
  );
}

function PaymentMethodCard({
  active,
  icon,
  iconBg,
  label,
  description,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl p-4 text-left transition-all ${
        active
          ? "border-2 border-primary bg-primary/5"
          : "border-2 border-slate-100 hover:border-slate-200"
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
        active ? "border-primary bg-primary" : "border-slate-300"
      }`}>
        {active && <Check className="h-3 w-3 text-white" />}
      </div>
    </button>
  );
}

function CheckoutField({
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
      <span className="text-[12px] font-bold text-slate-600">{label}</span>
      <input
        required
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[13px] outline-none focus:border-primary/40 focus:bg-white transition-all"
      />
    </label>
  );
}
