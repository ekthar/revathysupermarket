"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { calculateDistanceKm } from "@/lib/distance";
import { SITE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
import { useTranslations } from "next-intl";
import type { StoreSettings } from "@/lib/store-settings";
import { AnimatedCheckmark, SuccessRing } from "@/components/ui/animated-checkmark";
import { Confetti } from "@/components/ui/confetti";
import { useFirstOrderCelebration, FirstOrderCelebration } from "@/components/ui/first-order-celebration";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { AddressSelector } from "@/components/checkout/address-selector";
import { DeliveryModeSelector } from "@/components/checkout/delivery-mode-selector";
import { OrderSummary } from "@/components/checkout/order-summary";
import { TipSelector } from "@/components/checkout/tip-selector";
import { DeliveryInstructions } from "@/components/checkout/delivery-instructions";


type CheckoutState = {
  customerName: string;
  phone: string;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  notes: string;
  paymentMethod: "COD" | "UPI_ON_DELIVERY" | "WALLET" | "CARD";
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

const STORAGE_KEY = "msm-customer-info";

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

// Save customer info to localStorage for next time (only name and phone - addresses are in DB)
function saveCustomerInfo(form: CheckoutState) {
  try {
    const toSave = {
      customerName: form.customerName,
      phone: form.phone
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}

export function CheckoutForm({
  deliveryRadiusKm = SITE.deliveryRadiusKm,
  deliveryEstimateMin = 25,
  deliveryEstimateMax = 45,
  minimumOrderValue = 99,
  storeLatitude,
  storeLongitude,
  deliveryFee: baseDeliveryFee = 40,
  freeDeliveryThreshold = 500,
  gstRatePercent = 0,
  gstin = "",
  allowScheduledDelivery = true,
  allowInstantDelivery = true,
  tipEnabled = true,
  codEnabled = true,
  upiOnDeliveryEnabled = true,
  savedAddresses = []
}: {
  deliveryRadiusKm?: number;
  deliveryEstimateMin?: number;
  deliveryEstimateMax?: number;
  minimumOrderValue?: number;
  storeLatitude?: number;
  storeLongitude?: number;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  gstRatePercent?: number;
  gstin?: string;
  allowScheduledDelivery?: boolean;
  allowInstantDelivery?: boolean;
  tipEnabled?: boolean;
  codEnabled?: boolean;
  upiOnDeliveryEnabled?: boolean;
  savedAddresses?: SavedAddress[];
}) {
  const rewardsEnabled = process.env.NEXT_PUBLIC_ENABLE_REWARDS !== "false";
  const { items, subtotal, clearCart } = useCart();
  const { showToast } = useToast();
  const t = useTranslations("checkout");
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [loaded, setLoaded] = useState(false);
  const { show: showCelebration, triggerCelebration, dismiss: dismissCelebration } = useFirstOrderCelebration();

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState<"ASAP" | "SCHEDULED">(
    allowInstantDelivery ? "ASAP" : "SCHEDULED"
  );
  const [deliverySlotId, setDeliverySlotId] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyRules, setLoyaltyRules] = useState({ pointValueRupees: 0.25, maxRedemptionPercent: 20 });
  const [quotedDeliveryFee, setQuotedDeliveryFee] = useState<number | null>(null);
  const [feeQuoteLoading, setFeeQuoteLoading] = useState(false);
  const [addressNotCovered, setAddressNotCovered] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  const fallbackDeliveryFee = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee;
  const deliveryFee = quotedDeliveryFee ?? fallbackDeliveryFee;
  const gstAmount = gstRatePercent > 0 ? Math.round(subtotal - subtotal / (1 + gstRatePercent / 100)) : 0;
  const totalAmount = subtotal + deliveryFee + tipAmount;

  // Fetch wallet balance on mount
  useEffect(() => {
    fetch("/api/account/wallet")
      .then((res) => res.ok ? res.json() : { balance: 0 })
      .then((data) => setWalletBalance(data.balance ?? 0))
      .catch(() => setWalletBalance(0))
      .finally(() => setWalletLoading(false));
  }, []);

  useEffect(() => {
    if (!rewardsEnabled) return;
    fetch("/api/account/loyalty")
      .then((res) => res.ok ? res.json() : { balance: 0 })
      .then((loyaltyData) => {
        setLoyaltyBalance(loyaltyData.balance ?? 0);
        if (loyaltyData.config) setLoyaltyRules({ pointValueRupees: loyaltyData.config.pointValueRupees ?? 0.25, maxRedemptionPercent: loyaltyData.config.maxRedemptionPercent ?? 20 });
      })
      .catch(() => undefined);
  }, [rewardsEnabled]);

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

  const isOutsideRadius = distance !== null && distance > deliveryRadiusKm;
  const locationOk = distance !== null && !isOutsideRadius;
  const canSubmit = items.length > 0 && locationOk && !addressNotCovered && !isSubmitting && subtotal >= minimumOrderValue && (deliveryMode === "ASAP" || Boolean(deliverySlotId));

  useEffect(() => {
    if (!allowScheduledDelivery) setDeliverySlotId("");
    // Nothing valid to switch to if both modes are disabled - leave deliveryMode as-is
    // rather than ping-ponging between the two branches below on every render.
    if (!allowInstantDelivery && !allowScheduledDelivery) return;
    // Use the functional updater (and omit `deliveryMode` from deps) so this effect only
    // re-runs when the *allowed* modes change, not every time it sets deliveryMode itself.
    setDeliveryMode((current) => {
      if (!allowInstantDelivery && current === "ASAP") return "SCHEDULED";
      if (!allowScheduledDelivery && current === "SCHEDULED") return "ASAP";
      return current;
    });
  }, [allowInstantDelivery, allowScheduledDelivery]);

  useEffect(() => {
    if (!tipEnabled && tipAmount > 0) setTipAmount(0);
  }, [tipEnabled, tipAmount]);

  useEffect(() => {
    if (form.paymentMethod === "COD" && !codEnabled) {
      update("paymentMethod", upiOnDeliveryEnabled ? "UPI_ON_DELIVERY" : "CARD");
    }
    if (form.paymentMethod === "UPI_ON_DELIVERY" && !upiOnDeliveryEnabled) {
      update("paymentMethod", codEnabled ? "COD" : "CARD");
    }
  }, [codEnabled, form.paymentMethod, upiOnDeliveryEnabled]);

  useEffect(() => {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!locationOk || !Number.isFinite(latitude) || !Number.isFinite(longitude)) { setQuotedDeliveryFee(null); setAddressNotCovered(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setFeeQuoteLoading(true);
      setAddressNotCovered(false);
      const response = await fetch("/api/delivery-fee/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude, longitude, subtotal }), signal: controller.signal }).catch(() => null);
      if (response?.ok) {
        const data = await response.json();
        setQuotedDeliveryFee(Number(data.fee));
        setAddressNotCovered(false);
      } else {
        setQuotedDeliveryFee(null);
        // OUTSIDE_DELIVERY_AREA means the address is genuinely outside the radius
        if (response?.status === 400) {
          const data = await response.json().catch(() => null);
          if (data?.code === "OUTSIDE_DELIVERY_AREA") setAddressNotCovered(true);
        }
      }
      setFeeQuoteLoading(false);
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [form.latitude, form.longitude, locationOk, subtotal]);

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

  function handleFormPatch(patch: Record<string, string>) {
    setForm((current) => ({ ...current, ...patch }));
  }


  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    if (!locationOk) {
      showToast("Location verification required — tap Detect to use GPS", "error");
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
          })),
          deliveryMode,
          deliverySlotId: deliveryMode === "SCHEDULED" ? deliverySlotId : undefined,
          promoCode: promoCode.trim() || undefined,
          loyaltyPoints,
          tipAmount: tipAmount > 0 ? tipAmount : undefined,
          deliveryInstructions: deliveryInstructions.trim() || undefined
        })
      });

      const data = await readApiResponse<{ error?: string; code?: string; orderId?: string; orderNumber?: string }>(response);
      setIsSubmitting(false);

      if (response.status === 503 && data.code === "RATE_LIMIT_UNAVAILABLE") {
        showToast("Our ordering system is temporarily busy. Please wait a moment and try again.", "error");
        return;
      }

      if (response.status === 429 && data.code === "RATE_LIMITED") {
        showToast("Too many attempts. Please wait a moment before trying again.", "error");
        return;
      }

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
    <form onSubmit={submit} className="pb-20 pt-4 md:pb-8">
      {/* First order celebration */}
      <FirstOrderCelebration show={showCelebration} onDismiss={dismissCelebration} />
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
              <h2 className="mt-6 font-display text-2xl font-black text-neutral-900 dark:text-white">Order Successful!</h2>
              <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                We&apos;re preparing your order. See updates in My Orders.
              </p>
              <div className="mt-6 grid gap-3">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link href="/" className="flex h-[48px] items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
                    Go Home
                  </Link>
                </motion.div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link href="/dashboard" className="flex h-[48px] items-center justify-center rounded-full border-2 border-neutral-200 text-sm font-bold text-neutral-700">
                    Track your order
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Step Progression Indicator */}
      <div className="mb-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-elevation-2">
        <div className="flex items-center justify-between">
          {[
            { label: "Address", step: 1 },
            { label: "Delivery", step: 2 },
            { label: "Payment", step: 3 },
            { label: "Review", step: 4 },
          ].map((item, idx) => (
            <div key={item.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white text-micro font-bold">
                  {item.step}
                </div>
                <span className="mt-1 text-micro font-semibold text-neutral-600 dark:text-neutral-400">{item.label}</span>
              </div>
              {idx < 3 && (
                <div className="mx-1.5 h-[2px] w-6 sm:w-10 bg-neutral-200 dark:bg-neutral-700" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-micro text-neutral-500 dark:text-neutral-400">
          Fill in all sections below to place your order
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_min(420px,40vw)] lg:gap-8">
        {/* Left column - Forms */}
        <div className="space-y-5">
          {/* Delivery ETA + Minimum Order Info */}
          <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-elevation-2 dark:bg-neutral-900">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-caption font-semibold text-neutral-800 dark:text-white">Delivery in {deliveryEstimateMin}-{deliveryEstimateMax} min</p>
                <p className="text-micro text-neutral-500 dark:text-neutral-400">
                  {subtotal < minimumOrderValue
                    ? `Add ₹${minimumOrderValue - subtotal} more (min order ₹${minimumOrderValue})`
                    : freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold
                      ? "Free delivery applied!"
                      : `Free delivery on orders above ₹${freeDeliveryThreshold}`}
                </p>
              </div>
            </div>
            {subtotal < minimumOrderValue && (
              <span className="text-micro font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded-full">
                Min ₹{minimumOrderValue}
              </span>
            )}
          </div>

          {/* Delivery Address (step 1) */}
          <AddressSelector
            form={form}
            onUpdate={(name, value) => update(name as keyof CheckoutState, value)}
            onFormPatch={handleFormPatch}
            savedAddresses={savedAddresses}
            locationState={locationState}
            onLocationStateChange={setLocationState}
            locationOk={locationOk}
            isOutsideRadius={isOutsideRadius}
            distance={distance}
            deliveryRadiusKm={deliveryRadiusKm}
          />

          {/* Delivery Mode Selector */}
          <DeliveryModeSelector
            deliveryMode={deliveryMode}
            onModeChange={setDeliveryMode}
            deliverySlotId={deliverySlotId}
            onSlotChange={setDeliverySlotId}
            scheduledEnabled={allowScheduledDelivery}
            instantEnabled={allowInstantDelivery}
          />

          {/* Tip for delivery partner */}
          {tipEnabled && <TipSelector tipAmount={tipAmount} onTipChange={setTipAmount} />}

          {/* Delivery instructions */}
          <DeliveryInstructions
            instructions={deliveryInstructions}
            onInstructionsChange={setDeliveryInstructions}
          />

          {rewardsEnabled && <section className="rounded-2xl border border-neutral-100 bg-white p-4 card-shadow dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-black text-neutral-900 dark:text-white">Offers and rewards</h2>
            <label className="mt-3 block text-xs font-bold text-muted-foreground">Promo code<input value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} maxLength={40} className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold" placeholder="Optional promo code" /></label>
            <label className="mt-3 block text-xs font-bold text-muted-foreground">Use points ({loyaltyBalance} available)<input type="number" min="0" max={loyaltyBalance} value={loyaltyPoints} onChange={(event) => setLoyaltyPoints(Math.min(loyaltyBalance, Math.max(0, Number(event.target.value))))} className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold" /></label>
            <p className="mt-2 text-xs text-muted-foreground">Each point is worth ₹{loyaltyRules.pointValueRupees}. Up to {loyaltyRules.maxRedemptionPercent}% of the order can be paid with points. Final discounts are verified securely when you place the order.</p>
          </section>}

          {/* Payment Method */}
          <PaymentMethodSelector
            paymentMethod={form.paymentMethod}
            onMethodChange={(method) => update("paymentMethod", method)}
            walletBalance={walletBalance}
            walletLoading={walletLoading}
            totalAmount={totalAmount}
            codEnabled={codEnabled}
            upiOnDeliveryEnabled={upiOnDeliveryEnabled}
          />
        </div>


        {/* Right column - Order Summary */}
        <OrderSummary
          items={items}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          feeQuoteLoading={feeQuoteLoading}
          freeDeliveryThreshold={freeDeliveryThreshold}
          gstRatePercent={gstRatePercent}
          gstAmount={gstAmount}
          tipAmount={tipAmount}
          totalAmount={totalAmount}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          message={message}
          addressNotCovered={addressNotCovered}
        />
      </div>
    </form>
  );
}
