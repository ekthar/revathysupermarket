"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
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
  ChevronUp,
  MapPin,
  Package,
  ShoppingBag,
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

const DeliveryMap = dynamic(
  () => import("./delivery-map").then((m) => ({ default: m.DeliveryMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
        <span className="text-sm text-neutral-400">Loading map...</span>
      </div>
    ),
  }
);

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

// Fun status messages that rotate
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
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return messages[index];
}

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

export function LiveOrderTracking({ initialData }: { initialData: TrackingData }) {
  const router = useRouter();
  const [data, setData] = useState<TrackingData>(initialData);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const funMessage = useFunMessage(data.status);

  const etaDisplayMode: EtaDisplayMode = data.etaDisplayMode ?? "after_assignment";

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
      if (etaVisible && !riderLoc) {
        return estimateOrderEta(data.status, { distanceKm: data.distanceKm });
      }
      return estimateOrderEta(data.status, { distanceKm: data.distanceKm });
    },
    [data.destination, data.status, data.distanceKm, etaDisplayMode]
  );

  useEffect(() => {
    setEtaMinutes(calculateEta(data.deliveryPartnerLocation));
  }, [data.deliveryPartnerLocation, calculateEta]);

  // Real-time updates
  const isDelivered = data.status === "DELIVERED";
  const { connectionState } = useOrderTracking({
    orderId: data.id,
    enabled: !isDelivered,
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

  const riderDistanceKm = computeRiderDistanceKm(data.deliveryPartnerLocation, data.destination);
  const isRiderEnRoute = isDeliveryEtaVisible(data.status as OrderStatus);
  const hasBillData = data.orderItems && data.orderItems.length > 0 && data.total != null;
  const currentStep = getTimelineStepIndex(data.status);
  const visibleEta = getVisibleEtaMinutes(data.status, etaMinutes);
  const dragControls = useDragControls();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* FULL-SCREEN MAP — occupies entire viewport */}
      <div className="absolute inset-0">
        {(data.deliveryPartnerLocation || ["OUT_FOR_DELIVERY", "ARRIVING", "READY_FOR_DELIVERY"].includes(data.status)) ? (
          <div className="h-full w-full [&_.h-\\[320px\\]]:!h-full [&_>div]:!rounded-none [&_>div]:!border-0">
            <DeliveryMap
              deliveryPartnerLocation={data.deliveryPartnerLocation}
              customerLocation={data.destination}
              storeLocation={{ latitude: data.storeLatitude, longitude: data.storeLongitude }}
              className="!rounded-none !border-0 !shadow-none h-full [&>div]:!h-full"
              etaMinutes={etaMinutes}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-secondary-50 to-white dark:from-neutral-900 dark:to-neutral-950">
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary-500 shadow-2xl shadow-secondary-500/40">
                  {data.status === "PACKING" ? <Package className="h-12 w-12 text-white" /> :
                   data.status === "ORDER_RECEIVED" || data.status === "ACCEPTED" ? <ShoppingBag className="h-12 w-12 text-white" /> :
                   <Truck className="h-12 w-12 text-white" />}
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-secondary-400/30 animate-ping" style={{ animationDuration: "2s" }} />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-neutral-900 dark:text-white">{getTimelineStatusLabel(data.status)}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={funMessage}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-1 text-sm text-neutral-500"
                  >
                    {funMessage}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* TOP BAR — floating over map */}
      <div className="relative z-10 safe-top">
        <div className="flex items-center justify-between px-4 pt-4">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm dark:bg-neutral-900/90"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
          </motion.button>

          {/* Live indicator pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm dark:bg-neutral-900/90"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary-500" />
            </span>
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">LIVE</span>
          </motion.div>

          {/* Call rider button */}
          {data.riderPhone && isRiderEnRoute && (
            <a
              href={`tel:${data.riderPhone}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm dark:bg-neutral-900/90"
            >
              <Phone className="h-5 w-5 text-secondary-600" />
            </a>
          )}
          {!data.riderPhone && <div className="w-10" />}
        </div>
      </div>

      {/* BOTTOM SHEET — draggable overlay */}
      <motion.div
        initial={{ y: "70%" }}
        animate={{ y: sheetExpanded ? "10%" : "55%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y < -50) setSheetExpanded(true);
          else if (info.offset.y > 50) setSheetExpanded(false);
        }}
        className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.15)] dark:bg-neutral-900 dark:shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
        style={{ top: 0 }}
      >
        {/* Drag handle — ONLY this area triggers sheet drag */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => setSheetExpanded(!sheetExpanded)}
        >
          <div className="h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>

        {/* Sheet content - scrollable (touch-action allows native scroll) */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8"
          style={{ touchAction: "pan-y" }}
          onTouchStart={(e) => {
            // If scrolled to top and swiping down, allow sheet collapse
            if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
              const touch = e.touches[0];
              const startY = touch.clientY;
              const handleTouchMove = (ev: TouchEvent) => {
                const deltaY = ev.touches[0].clientY - startY;
                if (deltaY > 40 && scrollRef.current && scrollRef.current.scrollTop <= 0) {
                  setSheetExpanded(false);
                  document.removeEventListener("touchmove", handleTouchMove);
                  document.removeEventListener("touchend", handleTouchEnd);
                }
              };
              const handleTouchEnd = () => {
                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("touchend", handleTouchEnd);
              };
              document.addEventListener("touchmove", handleTouchMove, { passive: true });
              document.addEventListener("touchend", handleTouchEnd);
            }
          }}
        >
          {/* Status + ETA Hero */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-secondary-600 dark:text-secondary-400">
                Order #{data.orderNumber}
              </p>
              <h2 className="mt-1 text-xl font-black text-neutral-900 dark:text-white">
                {getTimelineStatusLabel(data.status)}
              </h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={funMessage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400"
                >
                  {funMessage}
                </motion.p>
              </AnimatePresence>
            </div>
            {/* ETA Circle */}
            {visibleEta !== null && !isDelivered && (
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-neutral-100 dark:text-neutral-800" />
                  <motion.circle
                    cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                    className="text-secondary-500"
                    strokeDasharray={175.9}
                    strokeDashoffset={175.9 * (1 - Math.min(etaMinutes ?? 30, 60) / 60)}
                    strokeLinecap="round"
                    animate={{ strokeDashoffset: 175.9 * (1 - Math.min(etaMinutes ?? 30, 60) / 60) }}
                    transition={{ duration: 1 }}
                  />
                </svg>
                <div className="text-center">
                  <p className="text-lg font-black text-neutral-900 dark:text-white">{etaMinutes}</p>
                  <p className="text-[9px] font-bold text-neutral-400">MIN</p>
                </div>
              </div>
            )}
            {isDelivered && (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900/30">
                <CheckCircle2 className="h-7 w-7 text-secondary-500" />
              </div>
            )}
          </div>

          {/* Compact Timeline Steps */}
          <div className="py-4">
            <div className="flex items-center justify-between gap-1">
              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <motion.div
                        animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0 }}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                          isCompleted ? "bg-secondary-500" :
                          isCurrent ? "bg-secondary-500 ring-4 ring-secondary-500/20" :
                          "bg-neutral-100 dark:bg-neutral-800"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                          <Icon className={`h-3.5 w-3.5 ${isCurrent ? "text-white" : "text-neutral-400"}`} />
                        )}
                      </motion.div>
                      <span className={`text-[9px] font-bold text-center leading-tight ${
                        isCompleted || isCurrent ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400"
                      }`}>
                        {step.label.split(" ")[0]}
                      </span>
                    </div>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <div className={`h-0.5 w-full min-w-[8px] rounded-full mx-0.5 ${
                        isCompleted ? "bg-secondary-500" : "bg-neutral-200 dark:bg-neutral-700"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rider Card */}
          {(data.riderName || isRiderEnRoute) && (
            <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 shadow-md">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    {data.riderName || "Finding a rider..."}
                  </p>
                  {isRiderEnRoute && riderDistanceKm != null && (
                    <p className="text-xs text-secondary-600 dark:text-secondary-400 font-semibold flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      {riderDistanceKm.toFixed(1)} km away
                      {etaMinutes && ` • ~${etaMinutes} min`}
                    </p>
                  )}
                  {!isRiderEnRoute && data.riderName && (
                    <p className="text-xs text-neutral-500">Will pick up your order</p>
                  )}
                </div>
                {data.riderPhone && (
                  <div className="flex gap-2">
                    <a href={`tel:${data.riderPhone}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900/40">
                      <Phone className="h-4 w-4 text-secondary-600" />
                    </a>
                    <a href={`https://wa.me/91${data.riderPhone}`} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery OTP */}
          {data.deliveryOtp && !isDelivered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border-2 border-dashed border-secondary-300 bg-secondary-50/50 p-4 mb-4 text-center dark:border-secondary-700 dark:bg-secondary-900/20"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-600 dark:text-secondary-400">
                Delivery PIN
              </p>
              <p className="mt-1 font-mono text-3xl font-black tracking-[0.3em] text-neutral-900 dark:text-white">
                {data.deliveryOtp}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">Share only with delivery partner</p>
            </motion.div>
          )}

          {/* Delivered celebration */}
          {isDelivered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-gradient-to-br from-secondary-50 to-secondary-100 p-6 mb-4 text-center dark:from-secondary-900/20 dark:to-secondary-900/10"
            >
              <CheckCircle2 className="mx-auto h-12 w-12 text-secondary-500" />
              <p className="mt-2 text-xl font-black text-secondary-700 dark:text-secondary-400">
                Order Delivered! 🎉
              </p>
              <p className="mt-1 text-sm text-secondary-600/70 dark:text-secondary-400/60">
                Enjoy your fresh groceries
              </p>
            </motion.div>
          )}

          {/* Order Bill */}
          {hasBillData && (
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

          {/* Contact store */}
          {!isDelivered && (
            <div className="mt-4 flex gap-3">
              <a href={`tel:${SITE.phone}`} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-100 py-3.5 text-sm font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                <Phone className="h-4 w-4" /> Call Store
              </a>
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-100 py-3.5 text-sm font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          )}

          <div className="h-8" />
        </div>
      </motion.div>
    </div>
  );
}
