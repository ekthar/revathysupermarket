"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, ChevronDown, Clock, Navigation, Plus, Smartphone, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { calculateDistanceKm } from "@/lib/distance";
import { SITE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
import { isServiceablePincode, serviceablePincodes } from "@/lib/delivery";
import type { StoreSettings } from "@/lib/store-settings";
import { AnimatedCheckmark, SuccessRing } from "@/components/ui/animated-checkmark";
import { Confetti } from "@/components/ui/confetti";
import { useFirstOrderCelebration, FirstOrderCelebration } from "@/components/ui/first-order-celebration";


type CheckoutState = {
  customerName: string;
  phone: string;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  notes: string;
  paymentMethod: "COD" | "UPI_ON_DELIVERY" | "WALLET";
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

const STORAGE_KEY = "store-customer-info";

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


// Load saved customer info from localStorage
function loadSavedInfo(): Partial<CheckoutState> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

// Save customer info to localStorage for next time
function saveCustomerInfo(form: CheckoutState) {
  try {
    const toSave = {
      customerName: form.customerName,
      phone: form.phone,
      houseName: form.houseName,
      street: form.street,
      landmark: form.landmark,
      pincode: form.pincode,
      latitude: form.latitude,
      longitude: form.longitude
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}

export function CheckoutForm({
  deliveryRadiusKm = SITE.deliveryRadiusKm,
  allowedPincodes = serviceablePincodes(),
  deliveryEstimateMin = 25,
  deliveryEstimateMax = 45,
  minimumOrderValue = 99,
  storeLatitude,
  storeLongitude,
  savedAddresses = []
}: {
  deliveryRadiusKm?: number;
  allowedPincodes?: StoreSettings["serviceablePincodes"];
  deliveryEstimateMin?: number;
  deliveryEstimateMax?: number;
  minimumOrderValue?: number;
  storeLatitude?: number;
  storeLongitude?: number;
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
  const [loaded, setLoaded] = useState(false);
  const { show: showCelebration, triggerCelebration, dismiss: dismissCelebration } = useFirstOrderCelebration();

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);

  const deliveryFee = subtotal > 500 ? 0 : 40;
  const tax = Math.round(subtotal * 0.02);
  const totalAmount = subtotal + deliveryFee + tax;

  // Fetch wallet balance on mount
  useEffect(() => {
    fetch("/api/account/wallet")
      .then((res) => res.ok ? res.json() : { balance: 0 })
      .then((data) => setWalletBalance(data.balance ?? 0))
      .catch(() => setWalletBalance(0))
      .finally(() => setWalletLoading(false));
  }, []);

  // Load saved customer info on mount (name, phone, address persist)
  useEffect(() => {
    const saved = loadSavedInfo();
    if (Object.keys(saved).length > 0) {
      setForm((current) => ({ ...current, ...saved }));
      if (saved.latitude && saved.longitude) setLocationState("success");
    }
    setLoaded(true);
  }, []);

  const distance = useMemo(() => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !form.latitude || !form.longitude) return null;
    const storeCoords = storeLatitude && storeLongitude
      ? { lat: storeLatitude, lng: storeLongitude }
      : undefined;
    return calculateDistanceKm({ lat, lng }, storeCoords);
  }, [form.latitude, form.longitude, storeLatitude, storeLongitude]);

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
        showToast("Location permission needed", "error");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }


  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    if (!pincodeOk) {
      showToast("Pincode is outside delivery area", "error");
      return;
    }
    if (!locationOk) {
      showToast("Location verification required", "error");
      return;
    }

    // Save customer info for next time (onboarding persistence)
    saveCustomerInfo(form);

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
        showToast(data.error ?? "Order could not be placed", "error");
        return;
      }

      clearCart();
      if (data.orderId) setPlacedOrderId(data.orderId);
      triggerCelebration();
      showToast("Order placed successfully", "success");
    } catch {
      setIsSubmitting(false);
      showToast("Order could not be placed", "error");
    }
  }


  return (
    <form onSubmit={submit} className="max-w-5xl mx-auto px-4 pt-2 pb-32 md:pb-8">
      {/* First order celebration */}
      <FirstOrderCelebration show={showCelebration} onDismiss={dismissCelebration} />

      {/* Order Success Modal with animated checkmark */}
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
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="success-modal"
            >
              <div className="flex justify-center">
                <SuccessRing size={100} />
              </div>
              <h2 className="mt-6 font-display text-2xl font-black text-slate-900">Order Successful!</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                We&apos;re preparing your order. See updates in My Orders.
              </p>
              <div className="mt-6 grid gap-3">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link href="/" className="flex h-[48px] items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    Go Home
                  </Link>
                </motion.div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link href="/dashboard" className="flex h-[48px] items-center justify-center rounded-full border-2 border-slate-200 text-sm font-bold text-slate-700">
                    Track your order
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Mobile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between py-3 md:hidden"
      >
        <div className="flex items-center gap-3">
          <Link href="/cart" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 press">
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Link>
          <h1 className="text-lg font-black text-slate-900">Checkout</h1>
        </div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:gap-8">
        {/* Left column - Forms */}
        <div className="space-y-5">
          {/* Delivery ETA + Minimum Order Info */}
          <div className="flex items-center justify-between rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-slate-800 dark:text-white">Delivery in {deliveryEstimateMin}-{deliveryEstimateMax} min</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {subtotal < minimumOrderValue
                    ? `Add ₹${minimumOrderValue - subtotal} more (min order ₹${minimumOrderValue})`
                    : "Free delivery on orders above ₹500"}
                </p>
              </div>
            </div>
            {subtotal < minimumOrderValue && (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded-full">
                Min ₹{minimumOrderValue}
              </span>
            )}
          </div>

          {/* Payment Method */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 card-elevated"
          >
            <h2 className="text-[15px] font-black text-slate-900 dark:text-white mb-4">Payment Method</h2>
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
              {/* Wallet Payment - only show if balance > 0 */}
              {!walletLoading && walletBalance > 0 && (
                <PaymentMethodCard
                  active={form.paymentMethod === "WALLET"}
                  icon={<Wallet className="h-5 w-5" />}
                  iconBg="bg-emerald-100 text-emerald-700"
                  label={`Wallet Balance (${formatCurrency(walletBalance)})`}
                  description={walletBalance >= totalAmount ? "Full amount covered" : `Remaining ${formatCurrency(totalAmount - walletBalance)} via COD`}
                  onClick={() => update("paymentMethod", "WALLET")}
                />
              )}
            </div>
            {form.paymentMethod === "WALLET" && walletBalance < totalAmount && (
              <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Wallet covers {formatCurrency(Math.min(walletBalance, totalAmount))}. Remaining {formatCurrency(totalAmount - walletBalance)} will be collected as Cash on Delivery.
                </p>
              </div>
            )}
          </motion.section>


          {/* Delivery Address */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 card-elevated"
          >
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
                <motion.div
                  animate={locationOk ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${locationOk ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}
                >
                  {locationOk ? <CheckCircle2 className="h-5 w-5" /> : <Navigation className="h-5 w-5" />}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800">
                    {locationOk ? `${distance?.toFixed(1)} KM from store` : "GPS verification needed"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Delivery within {deliveryRadiusKm} KM only</p>
                </div>
                <motion.button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locationState === "loading"}
                  whileTap={{ scale: 0.9 }}
                  className="shrink-0 px-3 py-2 rounded-full bg-primary text-white text-[11px] font-bold"
                >
                  {locationState === "loading" ? "Finding..." : locationOk ? "Refresh" : "Detect"}
                </motion.button>
              </div>
              {isOutsideRadius && (
                <p className="mt-3 text-[11px] font-semibold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Outside delivery radius ({distance?.toFixed(1)} KM)
                </p>
              )}
            </div>


            {/* Address fields - pre-filled from saved info */}
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
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-[13px] outline-none resize-none h-20 focus:border-primary/40 transition-all"
                  placeholder="Gate color, preferred time..."
                />
              </label>
            </div>

            {/* Manual coordinates */}
            <button type="button" onClick={() => setShowManualLocation((c) => !c)} className="mt-3 text-[12px] font-bold text-primary flex items-center gap-1">
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
          </motion.section>
        </div>


        {/* Right column - Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:sticky lg:top-[90px] h-fit"
        >
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 card-elevated">
            <h2 className="text-[15px] font-black text-slate-900">Order Summary</h2>
            <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-600 truncate flex-1 mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-semibold text-slate-800 shrink-0">{formatCurrency((item.discountPrice ?? item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
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
                  <span className="text-primary">{"₹"}</span> {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
            {message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[12px] font-medium text-slate-600">{message}</p>}
            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: canSubmit ? 1.01 : 1 }}
              className="mt-5 flex h-[50px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-emerald-500 text-white text-[14px] font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 transition-opacity"
            >
              {isSubmitting ? "Placing order..." : "Pay Now"}
            </motion.button>
            {!canSubmit && (
              <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
                Complete address, pincode & GPS to proceed
              </p>
            )}
          </section>
        </motion.div>
      </div>
    </form>
  );
}


function PaymentMethodCard({
  active, icon, iconBg, label, description, onClick
}: {
  active: boolean; icon: React.ReactNode; iconBg: string;
  label: string; description: string; onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      animate={active ? { borderColor: "rgba(15,138,95,1)" } : { borderColor: "rgba(241,245,249,1)" }}
      className={`w-full flex items-center gap-3 rounded-2xl p-4 text-left border-2 transition-colors ${
        active ? "bg-primary/5" : "hover:border-slate-200"
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      </div>
      <motion.div
        animate={active ? { scale: 1, backgroundColor: "#0F8A5F" } : { scale: 1, backgroundColor: "transparent" }}
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
          active ? "border-primary" : "border-slate-300"
        }`}
      >
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Check className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}

function CheckoutField({
  label, value, onChange, type = "text", inputMode, className
}: {
  label: string; value: string; onChange: (value: string) => void;
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; className?: string;
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
