"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  CheckCircle2,
  Truck,
  Package,
  ShoppingBag,
  CircleDot,
} from "lucide-react";
import { SITE, STORE_COORDINATES } from "@/lib/constants";
import { useOrderTracking, type TrackingUpdate } from "@/lib/hooks/use-order-tracking";

const DeliveryMap = dynamic(
  () => import("./delivery-map").then((m) => ({ default: m.DeliveryMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] w-full items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
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
};

const TRACKING_STEPS = [
  {
    key: "ORDER_RECEIVED",
    label: "Order received",
    subtitle: "We got it. The store is preparing.",
    icon: ShoppingBag,
  },
  {
    key: "PACKING",
    label: "Packing your bag",
    subtitle: "Hand-picked items, carefully packed.",
    icon: Package,
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    subtitle: "Your rider is on the way.",
    icon: Truck,
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    subtitle: "Enjoy your fresh groceries!",
    icon: CheckCircle2,
  },
];

function getStepIndex(status: string): number {
  if (["ORDER_RECEIVED", "AWAITING_CUSTOMER_APPROVAL", "ACCEPTED"].includes(status)) return 0;
  if (status === "PACKING") return 1;
  if (["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "ARRIVING"].includes(status)) return 2;
  if (status === "DELIVERED") return 3;
  return 0;
}

function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const radius = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ORDER_RECEIVED: "Order received",
    AWAITING_CUSTOMER_APPROVAL: "Awaiting approval",
    ACCEPTED: "Order confirmed",
    PACKING: "Packing your bag",
    READY_FOR_DELIVERY: "Ready for delivery",
    OUT_FOR_DELIVERY: "Out for delivery",
    ARRIVING: "Arriving soon",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return map[status] || status;
}

export function LiveOrderTracking({ initialData }: { initialData: TrackingData }) {
  const router = useRouter();
  const [data, setData] = useState<TrackingData>(initialData);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  const calculateEta = useCallback(
    (riderLoc: { latitude: number; longitude: number } | null) => {
      // Only show ETA after rider has accepted and is en route
      const riderEnRoute = ["OUT_FOR_DELIVERY", "ARRIVING"].includes(data.status);
      if (!riderEnRoute) return null;

      if (!riderLoc) {
        // Rider accepted but no location yet — show a reasonable estimate
        return 8;
      }
      const dist = distanceKm(riderLoc, data.destination);
      return Math.max(2, Math.ceil((dist / 18) * 60));
    },
    [data.destination, data.status]
  );

  useEffect(() => {
    setEtaMinutes(calculateEta(data.deliveryPartnerLocation));
  }, [data.deliveryPartnerLocation, calculateEta]);

  // ─── REAL-TIME UPDATES via Event-Driven SSE Gateway ───
  // Connects to /api/realtime/orders/{id} which reads from Redis Streams.
  // Zero database queries in the real-time loop.
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
    }, []),
  });

  const currentStep = getStepIndex(data.status);
  const phoneNumber = data.riderPhone || SITE.phone;

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className="relative min-h-screen bg-background dark:bg-neutral-950 pb-safe"
    >
      {/* Fixed top LIVE ORDER banner */}
      <div className="ios-sticky-tracking-header bg-background/90 dark:bg-neutral-950/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary-600 via-secondary-500 to-secondary-400 p-3.5 shadow-lg shadow-secondary-500/20 dark:shadow-secondary-900/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Pulse dot */}
              <div className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </div>
              <div>
                <p className="text-micro font-bold uppercase tracking-wider text-white/80">
                  Live Order
                </p>
                <p className="text-body font-bold text-white">
                  {getStatusLabel(data.status)}
                </p>
              </div>
            </div>
            <div className="text-right">
              {etaMinutes !== null && !isDelivered && (
                <p className="text-xl font-black text-white">{etaMinutes} min</p>
              )}
              {isDelivered && (
                <p className="text-sm font-bold text-white">Complete</p>
              )}
              <p className="text-micro font-semibold uppercase tracking-wider text-white/70">
                {isDelivered ? "Order delivered" : "Tap to track"}
              </p>
            </div>
          </div>
          {/* Decorative gradient circles */}
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
        </motion.div>
      </div>

      {/* Back button */}
      <div className="px-4 pt-4">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md dark:bg-neutral-800 dark:shadow-neutral-900/50 press"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-4">
        {/* Rider info card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 24 }}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 card-shadow dark:bg-neutral-900"
        >
          {/* Avatar */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 shadow-md shadow-secondary-500/20">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-caption font-semibold text-neutral-400 dark:text-neutral-500">
              Your rider
            </p>
            <p className="text-title font-bold text-neutral-900 dark:text-white truncate">
              {data.riderName || "Assigning rider..."}
            </p>
          </div>
          {data.riderName && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-50 dark:bg-secondary-900/30">
              <CheckCircle2 className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
            </div>
          )}
        </motion.div>

        {/* Map/tracking visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 240, damping: 22 }}
        >
          {(data.deliveryPartnerLocation ||
            ["OUT_FOR_DELIVERY", "ARRIVING", "READY_FOR_DELIVERY"].includes(data.status)) ? (
            <DeliveryMap
              deliveryPartnerLocation={data.deliveryPartnerLocation}
              customerLocation={data.destination}
              storeLocation={{ latitude: STORE_COORDINATES.lat, longitude: STORE_COORDINATES.lng }}
              className="shadow-md"
            />
          ) : (
            <div className="relative ios-map-placeholder flex items-center justify-center">
              {/* Delivery icon overlay */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-500 shadow-lg shadow-secondary-500/40">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                {data.deliveryPartnerLocation && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="rounded-full bg-neutral-900/80 px-3 py-1 text-micro font-bold text-white dark:bg-white/90 dark:text-neutral-900"
                  >
                    {distanceKm(
                      data.deliveryPartnerLocation,
                      data.destination
                    ).toFixed(1)}{" "}
                    km away
                  </motion.div>
                )}
              </motion.div>
              {/* Pulse rings around the delivery icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-24 w-24 rounded-full border-2 border-secondary-400/30 animate-ping" style={{ animationDuration: "2s" }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* ETA countdown section */}
        <AnimatePresence mode="wait">
          {etaMinutes !== null && !isDelivered && (
            <motion.div
              key="eta"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="rounded-2xl bg-white p-5 text-center card-shadow dark:bg-neutral-900"
            >
              <p className="text-caption font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Arriving in
              </p>
              <p className="mt-1 font-display text-4xl font-black text-neutral-900 dark:text-white">
                {etaMinutes}{" "}
                <span className="text-lg font-bold text-neutral-400">min</span>
              </p>
            </motion.div>
          )}
          {isDelivered && (
            <motion.div
              key="delivered"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-secondary-50 p-5 text-center dark:bg-secondary-900/20"
            >
              <CheckCircle2 className="mx-auto h-10 w-10 text-secondary-500" />
              <p className="mt-2 font-display text-xl font-black text-secondary-700 dark:text-secondary-400">
                Order Delivered!
              </p>
              <p className="mt-1 text-sm text-secondary-600/70 dark:text-secondary-400/70">
                Enjoy your fresh groceries
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call and message buttons */}
        {!isDelivered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3"
          >
            <a
              href={`tel:${phoneNumber}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-neutral-900 card-shadow press dark:bg-neutral-900 dark:text-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900/40">
                <Phone className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
              </div>
              <span className="text-body font-bold">Call</span>
            </a>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-neutral-900 card-shadow press dark:bg-neutral-900 dark:text-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-body font-bold">Message</span>
            </a>
          </motion.div>
        )}

        {/* Order status timeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 240, damping: 24 }}
          className="rounded-2xl bg-white p-5 card-shadow dark:bg-neutral-900"
        >
          <p className="text-caption font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-5">
            Order Status
          </p>
          <div className="space-y-0">
            {TRACKING_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isPending = index > currentStep;
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.5 + index * 0.1,
                    type: "spring",
                    stiffness: 260,
                    damping: 24,
                  }}
                  className="relative flex gap-4"
                >
                  {/* Timeline line and dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-secondary-500 shadow-md shadow-secondary-500/30"
                          : isCurrent
                          ? "bg-secondary-500 shadow-lg shadow-secondary-500/40"
                          : "bg-neutral-100 dark:bg-neutral-800"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : isCurrent ? (
                        <>
                          <StepIcon className="h-4 w-4 text-white" />
                          <span className="absolute inset-0 rounded-full animate-ping bg-secondary-500/30" />
                        </>
                      ) : (
                        <CircleDot className="h-4 w-4 text-neutral-300 dark:text-neutral-600" />
                      )}
                    </div>
                    {/* Connector line */}
                    {index < TRACKING_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 min-h-[2rem] transition-colors duration-300 ${
                          isCompleted
                            ? "bg-secondary-500"
                            : "bg-neutral-100 dark:bg-neutral-800"
                        }`}
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="pb-6 pt-1.5">
                    <p
                      className={`text-body font-bold transition-colors ${
                        isCompleted || isCurrent
                          ? "text-neutral-900 dark:text-white"
                          : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`mt-0.5 text-caption transition-colors ${
                        isCompleted || isCurrent
                          ? "text-neutral-500 dark:text-neutral-400"
                          : "text-neutral-300 dark:text-neutral-600"
                      }`}
                    >
                      {step.subtitle}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* OTP section */}
        {data.deliveryOtp && !isDelivered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl border border-secondary-200 bg-secondary-50 p-4 dark:border-secondary-800 dark:bg-secondary-900/20"
          >
            <p className="text-micro font-bold uppercase tracking-wider text-secondary-700 dark:text-secondary-400">
              Delivery OTP
            </p>
            <p className="mt-2 font-mono text-3xl font-black tracking-[0.25em] text-neutral-900 dark:text-white">
              {data.deliveryOtp}
            </p>
            <p className="mt-1 text-caption text-secondary-600/70 dark:text-secondary-400/60">
              Share this code only with the delivery person.
            </p>
          </motion.div>
        )}

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </motion.main>
  );
}
