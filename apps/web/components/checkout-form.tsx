"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Tag, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { springs, tapScale } from "@/lib/motion";
import { useCart } from "@/components/cart/cart-provider";
import { calculateDistanceKm } from "@/lib/distance";
import { SITE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
import { useTranslations } from "next-intl";
import { haptic, hapticSuccess, hapticError } from "@/lib/haptics";
import { trackOrderForReview, maybeRequestReview } from "@/lib/native-review";
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
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { RazorpayButton } from "@/components/checkout/razorpay-button";


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
  customerName: string;
  phone: string;
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
  razorpayEnabled = false,
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
  razorpayEnabled?: boolean;
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
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDescription, setPromoDescription] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyRules, setLoyaltyRules] = useState({ pointValueRupees: 0.25, maxRedemptionPercent: 20 });
  const [quotedDeliveryFee, setQuotedDeliveryFee] = useState<number | null>(null);
  const [feeQuoteLoading, setFeeQuoteLoading] = useState(false);
  const [addressNotCovered, setAddressNotCovered] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [deliveryOptionsOpen, setDeliveryOptionsOpen] = useState(true);
  const [offersSectionOpen, setOffersSectionOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState("");

  const fallbackDeliveryFee = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee;
  const deliveryFee = quotedDeliveryFee ?? fallbackDeliveryFee;
  const gstAmount = gstRatePercent > 0 ? Math.round(subtotal - subtotal / (1 + gstRatePercent / 100)) : 0;
  const totalAmount = subtotal - promoDiscount + deliveryFee + tipAmount;

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
      update("paymentMethod", upiOnDeliveryEnabled ? "UPI_ON_DELIVERY" : razorpayEnabled ? "CARD" : "WALLET");
    }
    if (form.paymentMethod === "UPI_ON_DELIVERY" && !upiOnDeliveryEnabled) {
      update("paymentMethod", codEnabled ? "COD" : razorpayEnabled ? "CARD" : "WALLET");
    }
    if (form.paymentMethod === "CARD" && !razorpayEnabled) {
      update("paymentMethod", codEnabled ? "COD" : upiOnDeliveryEnabled ? "UPI_ON_DELIVERY" : "WALLET");
    }
  }, [codEnabled, form.paymentMethod, upiOnDeliveryEnabled, razorpayEnabled]);

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

  // Load promo code from cart page via sessionStorage
  const skipNextPromoValidationRef = useRef(false);
  useEffect(() => {
    const savedCode = sessionStorage.getItem("msm-promo-code");
    if (savedCode) {
      skipNextPromoValidationRef.current = true;
      setPromoCode(savedCode);
      setPromoApplied(true);
      setPromoLoading(true);
      fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: savedCode, subtotal })
      }).then(async (res) => {
        const data = await res.json();
        if (res.ok && data.valid) {
          setPromoDiscount(data.discount);
          setPromoDescription(data.description || "Coupon applied");
          setPromoApplied(true);
        } else {
          setPromoApplied(false);
          setPromoDiscount(0);
          setPromoDescription("");
        }
      }).catch(() => {
        setPromoApplied(false);
        setPromoDiscount(0);
      }).finally(() => setPromoLoading(false));
    }
  }, []);

  // Validate promo code when it changes (debounced)
  const promoValidationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (skipNextPromoValidationRef.current) {
      skipNextPromoValidationRef.current = false;
      return;
    }
    if (!promoCode.trim()) {
      setPromoApplied(false);
      setPromoDiscount(0);
      setPromoDescription("");
      setPromoError("");
      return;
    }
    setPromoLoading(true);
    setPromoError("");
    if (promoValidationTimerRef.current) clearTimeout(promoValidationTimerRef.current);
    promoValidationTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/promo-codes/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: promoCode.trim(), subtotal })
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          setPromoApplied(true);
          setPromoDiscount(data.discount);
          setPromoDescription(data.description || "Coupon applied");
          setPromoError("");
        } else {
          setPromoApplied(false);
          setPromoDiscount(0);
          setPromoDescription("");
          setPromoError(data.error || "Invalid coupon code");
        }
      } catch {
        setPromoApplied(false);
        setPromoDiscount(0);
        setPromoDescription("");
        setPromoError("Could not validate code");
      } finally {
        setPromoLoading(false);
      }
    }, 500);
    return () => { if (promoValidationTimerRef.current) clearTimeout(promoValidationTimerRef.current); };
  }, [promoCode, subtotal]);

  const router = useRouter();
  const userNavigatedRef = useRef(false);

  // Redirect to cart page if cart is empty (guard against direct navigation)
  useEffect(() => {
    if (items.length === 0 && !placedOrderId) {
      router.push("/cart");
    }
  }, [items.length, placedOrderId, router]);

  useEffect(() => {
    if (!placedOrderId) return;
    const timeout = window.setTimeout(() => {
      if (!userNavigatedRef.current) {
        router.push("/dashboard");
      }
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [placedOrderId, router]);


  function update(name: keyof CheckoutState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleFormPatch(patch: Record<string, string>) {
    setForm((current) => ({ ...current, ...patch }));
  }


  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    haptic("medium");
    setMessage("");
    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    if (!locationOk) {
      showToast("Location verification required — tap Detect to use GPS", "error");
      return;
    }

    setShowConfirm(true);
  }

  async function placeOrder() {
    if (isSubmitting) return;
    if (items.length === 0) { showToast("Your cart is empty", "error"); return; }
    setShowConfirm(false);

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

      // If Razorpay enabled and payment method is CARD, start the online payment flow
      if (razorpayEnabled && form.paymentMethod === "CARD" && data.orderId) {
        setRazorpayOrderId(data.orderId);
        return;
      }

      clearCart();
      if (data.orderId) setPlacedOrderId(data.orderId);
      triggerCelebration();
      hapticSuccess();
      trackOrderForReview();
      void maybeRequestReview(); // Non-blocking: OS may or may not show dialog
      showToast("Order placed successfully", "success");
    } catch {
      setIsSubmitting(false);
      hapticError();
      showToast("Order could not be placed", "error");
    }
  }

  function handleRazorpaySuccess() {
    clearCart();
    setPlacedOrderId(razorpayOrderId);
    setRazorpayOrderId("");
    triggerCelebration();
    hapticSuccess();
    trackOrderForReview();
    void maybeRequestReview();
    showToast("Order placed and payment successful!", "success");
  }

  function handleRazorpayFailure(error: string) {
    showToast(error || "Payment failed. You can retry or choose another method.", "error");
  }


  return (
    <form onSubmit={submit} className="pb-20 pt-4 md:pb-8">
      {/* First order celebration */}
      <FirstOrderCelebration show={showCelebration} onDismiss={dismissCelebration} />

      {/* Confirm order dialog */}
      <BottomSheet open={showConfirm} onClose={() => setShowConfirm(false)} title="Place this order?">
        <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          <div className="flex justify-between"><span>Items</span><span className="font-semibold text-neutral-900 dark:text-white">{items.length}</span></div>
          <div className="flex justify-between"><span>Total</span><span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(totalAmount)}</span></div>
          <div className="flex justify-between"><span>Payment</span><span className="font-semibold text-neutral-900 dark:text-white">{form.paymentMethod === "COD" ? "Cash on Delivery" : form.paymentMethod === "UPI_ON_DELIVERY" ? "UPI on Delivery" : form.paymentMethod === "CARD" ? "Pay Online" : form.paymentMethod}</span></div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="h-12 rounded-2xl border border-neutral-200 bg-card text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { haptic("heavy"); placeOrder(); }}
            disabled={isSubmitting}
            className="h-12 rounded-2xl bg-black text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:opacity-40"
          >
            {isSubmitting ? "Placing..." : "Confirm & Place"}
          </button>
        </div>
      </BottomSheet>

      {/* Razorpay payment modal */}
      <BottomSheet
        open={Boolean(razorpayOrderId)}
        onClose={() => setRazorpayOrderId("")}
        title="Complete Payment"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Your order has been created. Complete the payment to confirm.
          </p>
          <RazorpayButton
            orderId={razorpayOrderId}
            customerName={form.customerName}
            customerPhone={form.phone}
            onSuccess={handleRazorpaySuccess}
            onFailure={handleRazorpayFailure}
          />
          <button
            type="button"
            onClick={() => setRazorpayOrderId("")}
            className="w-full h-11 rounded-2xl border border-neutral-200 bg-card text-sm font-bold text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            Cancel
          </button>
        </div>
      </BottomSheet>
      <AnimatePresence>
        {placedOrderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="success-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
          >
            <Confetti />
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={springs.enter}
              className="success-modal"
            >
              <div className="flex justify-center">
                <SuccessRing size={100} />
              </div>
              <h2 id="success-modal-title" className="mt-6 font-display text-2xl font-black text-neutral-900 dark:text-white">Order Successful!</h2>
              <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                We&apos;re preparing your order. See updates in My Orders.
              </p>
              <div className="mt-6 grid gap-3">
                <motion.div whileTap={tapScale.primary}>
                  <Link href="/" onClick={() => { userNavigatedRef.current = true; }} className="flex h-[48px] items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
                    Go Home
                  </Link>
                </motion.div>
                <motion.div whileTap={tapScale.primary}>
                  <Link href="/dashboard" onClick={() => { userNavigatedRef.current = true; }} className="flex h-[48px] items-center justify-center rounded-full border-2 border-neutral-200 text-sm font-bold text-neutral-700">
                    Track your order
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Step Progression Indicator — reflects real progress */}
      {(() => {
        const addressDone = Boolean(form.customerName && form.phone && form.houseName && form.pincode && locationOk);
        const deliveryDone = deliveryMode === "ASAP" || Boolean(deliverySlotId);
        const paymentDone = Boolean(form.paymentMethod);
        const steps = [
          { label: "Address", done: addressDone },
          { label: "Delivery", done: deliveryDone },
          { label: "Payment", done: paymentDone },
          { label: "Place", done: canSubmit },
        ];
        const activeIndex = steps.findIndex((s) => !s.done);
        return (
          <div className="mb-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-card dark:bg-neutral-900 px-3 py-3 shadow-elevation-2">
            <div className="flex items-center justify-between gap-1">
              {steps.map((item, idx) => {
                const isActive = activeIndex === idx || (activeIndex === -1 && idx === steps.length - 1);
                const isDone = item.done;
                return (
                  <div key={item.label} className="flex flex-1 items-center min-w-0">
                    <div className="flex flex-col items-center gap-1 min-w-0 w-full">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                          isDone
                            ? "bg-secondary-500 text-white"
                            : isActive
                              ? "bg-black text-white"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] font-bold truncate max-w-full ${
                          isDone || isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`mx-0.5 h-[2px] flex-1 min-w-[8px] rounded-full ${
                          isDone ? "bg-secondary-400" : "bg-neutral-200 dark:bg-neutral-700"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="grid gap-5 lg:grid-cols-[1fr_min(420px,40vw)] lg:gap-8">
        {/* Left column - Forms */}
        <div className="space-y-5">
          {/* Delivery ETA + Minimum Order Info */}
          <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-card px-4 py-3 shadow-elevation-2 dark:bg-neutral-900">
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

          {/* Delivery Options Accordion */}
          <section className="rounded-2xl border border-neutral-100 bg-card dark:border-neutral-800 dark:bg-neutral-900 card-shadow overflow-hidden">
            <button
              type="button"
              onClick={() => setDeliveryOptionsOpen(!deliveryOptionsOpen)}
              aria-expanded={deliveryOptionsOpen}
              aria-controls="delivery-options-panel"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <h2 className="text-sm font-black text-neutral-900 dark:text-white">Delivery Options</h2>
              <motion.div
                animate={{ rotate: deliveryOptionsOpen ? 180 : 0 }}
                transition={springs.snappy}
              >
                <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </motion.div>
            </button>
            <AnimatePresence>
              {deliveryOptionsOpen && (
                <motion.div
                  id="delivery-options-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={springs.snappy}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4">
                    <DeliveryModeSelector
                      deliveryMode={deliveryMode}
                      onModeChange={setDeliveryMode}
                      deliverySlotId={deliverySlotId}
                      onSlotChange={setDeliverySlotId}
                      scheduledEnabled={allowScheduledDelivery}
                      instantEnabled={allowInstantDelivery}
                    />
                    {tipEnabled && <TipSelector tipAmount={tipAmount} onTipChange={setTipAmount} />}
                    <DeliveryInstructions
                      instructions={deliveryInstructions}
                      onInstructionsChange={setDeliveryInstructions}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Offers and Rewards - Collapsible */}
          {rewardsEnabled && (
            <section className="rounded-2xl border border-neutral-100 bg-card dark:border-neutral-800 dark:bg-neutral-900 card-shadow overflow-hidden">
              <button
                type="button"
                onClick={() => setOffersSectionOpen(!offersSectionOpen)}
                aria-expanded={offersSectionOpen}
                aria-controls="offers-panel"
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-neutral-900 dark:text-white">Offers & Rewards</h2>
                  {promoApplied && promoDiscount > 0 && (
                    <span className="text-[10px] font-bold text-secondary-600 bg-secondary-50 dark:bg-secondary-900/20 px-2 py-0.5 rounded-full">
                      1 coupon
                    </span>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: offersSectionOpen ? 180 : 0 }}
                  transition={springs.snappy}
                >
                  <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                </motion.div>
              </button>
              <AnimatePresence>
                {offersSectionOpen && (
                  <motion.div
                    id="offers-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={springs.snappy}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1">Promo code</label>
                        {promoApplied && promoDiscount > 0 ? (
                          <div className="flex items-center justify-between rounded-xl bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800 px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-secondary-600" />
                              <span className="text-sm font-bold text-secondary-700 dark:text-secondary-300">{promoCode.toUpperCase()}</span>
                              {promoDescription && <span className="text-caption text-neutral-500">— {promoDescription}</span>}
                            </div>
                            <button type="button" onClick={() => { setPromoCode(""); setPromoApplied(false); setPromoDiscount(0); setPromoDescription(""); setPromoError(""); }} aria-label="Remove coupon code" className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors">
                              <X className="h-3.5 w-3.5 text-neutral-400 hover:text-red-500" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} maxLength={40} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold" placeholder="Enter coupon code" />
                            {promoLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}
                          </div>
                        )}
                        {promoError && !promoApplied && <p role="alert" aria-live="polite" className="mt-1.5 text-micro text-red-500 flex items-center gap-1"><X className="h-3 w-3" aria-hidden="true" />{promoError}</p>}
                        {promoApplied && promoDiscount > 0 && (
                          <p className="mt-1.5 text-micro font-semibold text-secondary-600 flex items-center gap-1"><Tag className="h-3 w-3" />You save {formatCurrency(promoDiscount)} on this order</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1">Use points ({loyaltyBalance} available)</label>
                        <input type="number" min="0" max={loyaltyBalance} value={loyaltyPoints} onChange={(event) => setLoyaltyPoints(Math.min(loyaltyBalance, Math.max(0, Number(event.target.value))))} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold" />
                        <p className="mt-2 text-xs text-muted-foreground">Each point is worth ₹{loyaltyRules.pointValueRupees}. Up to {loyaltyRules.maxRedemptionPercent}% of the order can be paid with points.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {/* Payment Method */}
          <PaymentMethodSelector
            paymentMethod={form.paymentMethod}
            onMethodChange={(method) => update("paymentMethod", method)}
            walletBalance={walletBalance}
            walletLoading={walletLoading}
            totalAmount={totalAmount}
            codEnabled={codEnabled}
            upiOnDeliveryEnabled={upiOnDeliveryEnabled}
            razorpayEnabled={razorpayEnabled}
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
          promoDiscount={promoDiscount}
          totalAmount={totalAmount}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          message={message}
          addressNotCovered={addressNotCovered}
          minimumOrderValue={minimumOrderValue}
          blockReason={
            items.length === 0
              ? "Your cart is empty"
              : addressNotCovered
                ? "Address is outside delivery area"
                : subtotal < minimumOrderValue
                  ? `Minimum order is ₹${minimumOrderValue}`
                  : !locationOk
                    ? "Verify location with GPS"
                    : deliveryMode === "SCHEDULED" && !deliverySlotId
                      ? "Pick a delivery slot"
                      : null
          }
        />
      </div>
    </form>
  );
}
