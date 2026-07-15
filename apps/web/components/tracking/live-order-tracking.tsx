"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { calculateDistanceKm } from "@/lib/distance";
import { springs } from "@/lib/motion";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  CheckCircle2,
  Truck,
  Navigation,
  ChevronDown,
  ChevronUp,
  Package,
  ShoppingBag,
  Home,
  Star,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { useOrderTracking, type TrackingUpdate } from "@/lib/hooks/use-order-tracking";
import { estimateOrderEta, type EtaDisplayMode } from "@/lib/live-order";
import { isDeliveryEtaVisible } from "@msm/shared";
import type { OrderStatus } from "@msm/shared";
import { getVisibleEtaMinutes } from "./delivery-eta";
import { OrderBill } from "./order-bill";
import { getTimelineStepIndex, getTimelineStatusLabel, TIMELINE_STEPS } from "./order-timeline";
import { haptic } from "@/lib/haptics";
import Link from "next/link";

const DeliveryMap = dynamic(
  () => import("./delivery-map").then((m) => ({ default: m.DeliveryMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-secondary-500" />
      </div>
    ),
  }
);

// ─── Types ───────────────────────────────────────────────────────────────────

type TrackingData = {
  id: string;
  orderNumber: string;
  status: string;
  deliveryOtp: string | null;
  destination: { latitude: number; longitude: number };
  createdAt: string;
  riderName: string | null;
  riderPhone: string | null;
  deliveryPartnerLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
    updatedAt?: string;
  } | null;
  statusEvents: Array<{
    status: string;
    note: string | null;
    createdAt: string;
  }>;
  distanceKm?: number;
  etaDisplayMode?: EtaDisplayMode;
  orderItems?: Array<{ name: string; quantity: number; price: number }>;
  subtotal?: number;
  deliveryFee?: number;
  tipAmount?: number;
  total?: number;
  paymentMethod?: string;
  storeLatitude: number;
  storeLongitude: number;
  updatedAt?: string;
};

// ─── Fun Messages ────────────────────────────────────────────────────────────

const FUN_MESSAGES: Record<string, string[]> = {
  ORDER_RECEIVED: ["We got your order! 🎉", "Our team is on it!", "Fresh picks incoming!"],
  AWAITING_CUSTOMER_APPROVAL: ["Just need your okay 👍", "Quick confirmation needed"],
  ACCEPTED: ["Your order is confirmed! ✅", "Getting things ready for you"],
  PACKING: ["Hand-picking the freshest items 🥬", "Carefully packing your bag 📦", "Almost packed!"],
  READY_FOR_DELIVERY: ["Packed and ready to go! 🚀", "Waiting for your rider..."],
  OUT_FOR_DELIVERY: ["Your rider is on the way! 🏍️", "Zooming to your doorstep!", "Almost there!"],
  ARRIVING: ["Rider's at your door! 🚪", "Time to grab your groceries!", "They're here!"],
  DELIVERED: ["Enjoy your fresh groceries! 🎊", "Order complete. See you soon!"],
};

function useFunMessage(status: string) {
  const [index, setIndex] = useState(0);
  const messages = FUN_MESSAGES[status] || ["Processing..."];

  // Reset index when status changes to avoid out-of-bounds
  useEffect(() => {
    setIndex(0);
  }, [status]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return messages[index % messages.length];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeRiderDistanceKm(
  riderLoc: { latitude: number; longitude: number } | null,
  destination: { latitude: number; longitude: number }
): number | null {
  if (!riderLoc) return null;
  return calculateDistanceKm(
    { lat: riderLoc.latitude, lng: riderLoc.longitude },
    { lat: destination.latitude, lng: destination.longitude }
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LiveOrderTracking({ initialData }: { initialData: TrackingData }) {
  const router = useRouter();
  const [data, setData] = useState<TrackingData>(initialData);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const funMessage = useFunMessage(data.status);

  const etaDisplayMode: EtaDisplayMode = data.etaDisplayMode ?? "after_assignment";

  // ─── ETA Calculation ─────────────────────────────────────────────────────────
  const calculateEta = useCallback(
    (riderLoc: { latitude: number; longitude: number } | null) => {
      const etaVisible = isDeliveryEtaVisible(data.status as OrderStatus);
      if (etaDisplayMode === "after_assignment" && !etaVisible) return null;
      if (data.status === "DELIVERED" || data.status === "CANCELLED") return null;
      if (etaVisible && riderLoc) {
        const dist = calculateDistanceKm(
          { lat: riderLoc.latitude, lng: riderLoc.longitude },
          { lat: data.destination.latitude, lng: data.destination.longitude }
        );
        return Math.max(2, Math.ceil((dist / 18) * 60));
      }
      return estimateOrderEta(data.status, { distanceKm: data.distanceKm });
    },
    [data.destination, data.status, data.distanceKm, etaDisplayMode]
  );

  useEffect(() => {
    setEtaMinutes(calculateEta(data.deliveryPartnerLocation));
  }, [data.deliveryPartnerLocation, calculateEta]);

  // ─── Real-time Updates ───────────────────────────────────────────────────────
  const isDelivered = data.status === "DELIVERED";
  const isCancelled = data.status === "CANCELLED";

  useOrderTracking({
    orderId: data.id,
    enabled: !isDelivered && !isCancelled,
    onUpdate: useCallback((update: TrackingUpdate) => {
      setData((prev) => ({
        ...prev,
        ...(update.status && { status: update.status }),
        ...(update.deliveryPartnerLocation !== undefined && {
          deliveryPartnerLocation: update.deliveryPartnerLocation,
        }),
      }));
      if (update.status) haptic("medium");
    }, []),
  });

  // ─── Derived State ───────────────────────────────────────────────────────────
  const riderDistanceKm = computeRiderDistanceKm(data.deliveryPartnerLocation, data.destination);
  const isRiderEnRoute = isDeliveryEtaVisible(data.status as OrderStatus);
  const hasBillData = data.orderItems && data.orderItems.length > 0 && data.total != null;
  const currentStep = getTimelineStepIndex(data.status);
  const visibleEta = getVisibleEtaMinutes(data.status, etaMinutes);
  const showMap = data.deliveryPartnerLocation || ["OUT_FOR_DELIVERY", "ARRIVING", "READY_FOR_DELIVERY"].includes(data.status);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-100 dark:bg-neutral-950">

      {/* ═══════════════ TOP BAR (safe-area aware) ═══════════════ */}
      <div
        className="relative z-30 flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}
      >
        {/* Back button — 44×44 minimum tap target */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md active:scale-90 transition-transform dark:bg-neutral-800"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
        </button>

        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-md dark:bg-neutral-800">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary-500" />
          </span>
          <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200">LIVE</span>
        </div>

        {/* Call rider / placeholder */}
        {data.riderPhone && isRiderEnRoute ? (
          <a
            href={`tel:${data.riderPhone}`}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md active:scale-90 transition-transform dark:bg-neutral-800"
            aria-label="Call delivery partner"
          >
            <Phone className="h-5 w-5 text-secondary-600" />
          </a>
        ) : (
          <div className="h-11 w-11" aria-hidden="true" />
        )}
      </div>

      {/* ═══════════════ MAP AREA ═══════════════ */}
      <div className="relative flex-1 min-h-0">
        {showMap ? (
          <DeliveryMap
            deliveryPartnerLocation={data.deliveryPartnerLocation}
            customerLocation={data.destination}
            storeLocation={{ latitude: data.storeLatitude, longitude: data.storeLongitude }}
            className="!rounded-none !border-0 !shadow-none"
            etaMinutes={etaMinutes}
          />
        ) : (
          /* Placeholder animation when map isn't needed */
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-secondary-50 to-white dark:from-neutral-900 dark:to-neutral-950">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-500 shadow-xl shadow-secondary-500/30">
                  {data.status === "PACKING" ? <Package className="h-10 w-10 text-white" /> :
                   data.status === "ORDER_RECEIVED" || data.status === "ACCEPTED" ? <ShoppingBag className="h-10 w-10 text-white" /> :
                   <Truck className="h-10 w-10 text-white" />}
                </div>
                <span className="absolute inset-0 rounded-full border-2 border-secondary-300/40 animate-ping" style={{ animationDuration: "2.5s" }} />
              </div>
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                {getTimelineStatusLabel(data.status)}
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* ═══════════════ BOTTOM SHEET ═══════════════ */}
      <motion.div
        layout
        animate={{ height: sheetExpanded ? "75vh" : "auto" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="relative z-20 flex flex-col rounded-t-3xl bg-white shadow-[0_-4px_30px_rgba(0,0,0,0.12)] dark:bg-neutral-900"
        style={{ maxHeight: "85vh" }}
      >
        {/* ─── Handle bar (44px tap target) ─── */}
        <button
          type="button"
          onClick={() => { setSheetExpanded(!sheetExpanded); haptic("light"); }}
          className="flex w-full min-h-[44px] items-center justify-center shrink-0"
          aria-label={sheetExpanded ? "Collapse details" : "Expand details"}
        >
          <div className="h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </button>

        {/* ─── Scrollable Content ─── */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8"
          style={{ minHeight: 0 }}
        >
          {/* Status + ETA Hero */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-600 dark:text-secondary-400">
                Order #{data.orderNumber}
              </p>
              <h2 className="mt-0.5 text-xl font-black text-neutral-900 dark:text-white">
                {getTimelineStatusLabel(data.status)}
              </h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={funMessage}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400"
                >
                  {funMessage}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* ETA Ring */}
            {visibleEta !== null && !isDelivered && (
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center ml-3">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-neutral-100 dark:text-neutral-800" />
                  <circle
                    cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                    className="text-secondary-500"
                    strokeDasharray={175.9}
                    strokeDashoffset={175.9 * (1 - Math.min(etaMinutes ?? 30, 60) / 60)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-lg font-black text-neutral-900 dark:text-white">{etaMinutes}</p>
                  <p className="text-[9px] font-bold text-neutral-400">MIN</p>
                </div>
              </div>
            )}
            {isDelivered && (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900/30 ml-3">
                <CheckCircle2 className="h-7 w-7 text-secondary-500" />
              </div>
            )}
          </div>

          {/* ─── Compact Timeline ─── */}
          <div className="py-4">
            <div className="flex items-center gap-0.5">
              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                          isCompleted ? "bg-secondary-500" :
                          isCurrent ? "bg-secondary-500 ring-2 ring-secondary-500/30" :
                          "bg-neutral-100 dark:bg-neutral-800"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <Icon className={`h-3 w-3 ${isCurrent ? "text-white" : "text-neutral-400"}`} />
                        )}
                      </div>
                      <span className={`text-[8px] font-bold text-center leading-tight max-w-[42px] ${
                        isCompleted || isCurrent ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400"
                      }`}>
                        {step.label.split(" ")[0]}
                      </span>
                    </div>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 min-w-[4px] rounded-full ${
                        isCompleted ? "bg-secondary-500" : "bg-neutral-200 dark:bg-neutral-700"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Rider Card ─── */}
          {(data.riderName || isRiderEnRoute) && (
            <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 shadow-sm">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {data.riderName || "Finding a rider..."}
                  </p>
                  {isRiderEnRoute && riderDistanceKm != null && (
                    <p className="text-xs text-secondary-600 dark:text-secondary-400 font-semibold flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      {riderDistanceKm < 0.1 ? "Arrived" : `${riderDistanceKm.toFixed(1)} km away`}
                      {etaMinutes && riderDistanceKm >= 0.1 ? ` • ~${etaMinutes} min` : ""}
                    </p>
                  )}
                  {!isRiderEnRoute && data.riderName && (
                    <p className="text-xs text-neutral-500">Will pick up your order</p>
                  )}
                </div>
                {data.riderPhone && (
                  <div className="flex gap-2 shrink-0">
                    <a href={`tel:${data.riderPhone}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900/40 active:scale-90 transition-transform" aria-label="Call rider">
                      <Phone className="h-4 w-4 text-secondary-600" />
                    </a>
                    <a href={`https://wa.me/91${data.riderPhone}`} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40 active:scale-90 transition-transform" aria-label="WhatsApp rider">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Delivery OTP ─── */}
          {data.deliveryOtp && !isDelivered && (
            <div className="rounded-2xl border-2 border-dashed border-secondary-300 bg-secondary-50/50 p-4 mb-4 text-center dark:border-secondary-700 dark:bg-secondary-900/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-600 dark:text-secondary-400">
                Delivery PIN
              </p>
              <p className="mt-1 font-mono text-3xl font-black tracking-[0.3em] text-neutral-900 dark:text-white">
                {data.deliveryOtp}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">Share only with delivery partner</p>
            </div>
          )}

          {/* ─── Delivered State ─── */}
          {isDelivered && (
            <div className="rounded-2xl bg-gradient-to-br from-secondary-50 to-secondary-100 p-6 mb-4 text-center dark:from-secondary-900/20 dark:to-secondary-900/10">
              <CheckCircle2 className="mx-auto h-12 w-12 text-secondary-500" />
              <p className="mt-2 text-xl font-black text-secondary-700 dark:text-secondary-400">
                Order Delivered! 🎉
              </p>
              <p className="mt-1 text-sm text-secondary-600/70 dark:text-secondary-400/60">
                Enjoy your fresh groceries
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href="/"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-neutral-700 shadow-sm border border-neutral-200 active:scale-95 transition-transform dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
                >
                  <Home className="h-4 w-4" /> Home
                </Link>
                <Link
                  href="/dashboard"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary-500 text-sm font-bold text-white shadow-sm active:scale-95 transition-transform"
                >
                  <Star className="h-4 w-4" /> Rate Order
                </Link>
              </div>
            </div>
          )}

          {/* ─── Order Bill (expanded view) ─── */}
          {sheetExpanded && hasBillData && (
            <OrderBill
              storeName={SITE.name}
              orderNumber={data.orderNumber}
              orderDate={data.createdAt}
              items={data.orderItems!}
              subtotal={data.subtotal ?? 0}
              deliveryFee={data.deliveryFee ?? 0}
              tipAmount={data.tipAmount ?? 0}
              total={data.total ?? 0}
              paymentMethod={data.paymentMethod ?? "COD"}
            />
          )}

          {/* ─── Contact Store (expanded view) ─── */}
          {sheetExpanded && !isDelivered && (
            <div className="mt-4 flex gap-3">
              <a href={`tel:${SITE.phone}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-100 py-3 text-sm font-bold text-neutral-700 active:bg-neutral-200 transition-colors dark:bg-neutral-800 dark:text-neutral-300">
                <Phone className="h-4 w-4" /> Call Store
              </a>
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-100 py-3 text-sm font-bold text-neutral-700 active:bg-neutral-200 transition-colors dark:bg-neutral-800 dark:text-neutral-300">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          )}

          {/* Expand hint when collapsed */}
          {!sheetExpanded && hasBillData && (
            <button
              type="button"
              onClick={() => setSheetExpanded(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 py-2.5 text-xs font-bold text-neutral-500 active:bg-neutral-50 dark:active:bg-neutral-800"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              View bill & more details
            </button>
          )}

          {/* Extra bottom space */}
          <div className="h-4" />
        </div>
      </motion.div>
    </div>
  );
}
