"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { useOrderTracking, type TrackingUpdate } from "@/lib/hooks/use-order-tracking";
import { estimateOrderEta, type EtaDisplayMode } from "@/lib/live-order";
import { isDeliveryEtaVisible } from "@msm/shared";
import type { OrderStatus } from "@msm/shared";
import { DeliveryEtaTracking, getVisibleEtaMinutes } from "./delivery-eta";
import { OrderBill } from "./order-bill";
import { OrderTimeline, getTimelineStatusLabel } from "./order-timeline";

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
  // Distance-aware ETA fields
  distanceKm?: number;
  etaDisplayMode?: EtaDisplayMode;
  // Order bill fields
  orderItems?: Array<{ name: string; quantity: number; price: number }>;
  subtotal?: number;
  deliveryFee?: number;
  tipAmount?: number;
  total?: number;
  paymentMethod?: string;
  storeLatitude: number;
  storeLongitude: number;
  // Last updated timestamp
  updatedAt?: string;
};

/** Compute distance in km from rider to customer destination */
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

  const etaDisplayMode: EtaDisplayMode = data.etaDisplayMode ?? "after_assignment";

  const calculateEta = useCallback(
    (riderLoc: { latitude: number; longitude: number } | null) => {
      // Use the shared utility to determine if ETA should be visible for the current status.
      // This enforces Requirements 3.1-3.4: ETA only visible for OUT_FOR_DELIVERY/ARRIVING.
      const etaVisible = isDeliveryEtaVisible(data.status as OrderStatus);

      // When mode is "after_assignment", only show ETA when status allows it
      if (etaDisplayMode === "after_assignment" && !etaVisible) {
        return null;
      }

      // When mode is "always", show ETA for all non-delivered/non-cancelled statuses
      if (data.status === "DELIVERED" || data.status === "CANCELLED") {
        return null;
      }

      // If ETA is visible (dispatch statuses) and we have rider location, calculate from rider position
      if (etaVisible && riderLoc) {
        const dist = calculateDistanceKm(
          { lat: riderLoc.latitude, lng: riderLoc.longitude },
          { lat: data.destination.latitude, lng: data.destination.longitude }
        );
        return Math.max(2, Math.ceil((dist / 18) * 60));
      }

      // If ETA is visible but no rider location yet
      if (etaVisible && !riderLoc) {
        return estimateOrderEta(data.status, { distanceKm: data.distanceKm });
      }

      // For other statuses (when mode is "always"), use distance-aware estimation
      return estimateOrderEta(data.status, { distanceKm: data.distanceKm });
    },
    [data.destination, data.status, data.distanceKm, etaDisplayMode]
  );

  useEffect(() => {
    setEtaMinutes(calculateEta(data.deliveryPartnerLocation));
  }, [data.deliveryPartnerLocation, calculateEta]);

  // Real-time updates via Event-Driven SSE Gateway
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

  const phoneNumber = data.riderPhone || SITE.phone;

  // Calculate rider-to-customer distance for display
  const riderDistanceKm = computeRiderDistanceKm(
    data.deliveryPartnerLocation,
    data.destination
  );
  const isRiderEnRoute = isDeliveryEtaVisible(data.status as OrderStatus);

  // Order bill data
  const hasBillData = data.orderItems && data.orderItems.length > 0 && data.total != null;

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.enter}
      className="relative min-h-screen bg-background dark:bg-neutral-950 pb-6"
    >
      {/* Fixed top LIVE ORDER banner */}
      <div className="ios-sticky-tracking-header bg-background/90 dark:bg-neutral-950/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, ...springs.snappy }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary-600 via-secondary-500 to-secondary-400 p-3.5 shadow-lg shadow-secondary-500/20 dark:shadow-secondary-900/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Pulse dot */}
              <div className="relative flex h-3 w-3">
                <span className="stay-light absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="stay-light relative inline-flex h-3 w-3 rounded-full bg-white" />
              </div>
              <div>
                <p className="text-micro font-bold uppercase tracking-wider text-white/80">
                  Live Order
                </p>
                <p className="text-body font-bold text-white">
                  {getTimelineStatusLabel(data.status)}
                </p>
              </div>
            </div>
            <div className="text-right">
              {getVisibleEtaMinutes(data.status, etaMinutes) !== null && !isDelivered && (
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
        {/* Rider info card - enhanced with distance when en route */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, ...springs.enter }}
          className="rounded-2xl bg-white p-4 card-shadow dark:bg-neutral-900"
        >
          <div className="flex items-center gap-3">
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
              {/* Distance badge when rider is en route */}
              {isRiderEnRoute && riderDistanceKm != null && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-secondary-600 dark:text-secondary-400">
                  <Navigation className="h-3 w-3" />
                  {riderDistanceKm.toFixed(1)} km away
                </span>
              )}
            </div>
            {/* Call button when rider is assigned and en route */}
            {data.riderName && isRiderEnRoute && data.riderPhone && (
              <a
                href={`tel:${data.riderPhone}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900/40 press"
              >
                <Phone className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
              </a>
            )}
            {data.riderName && !isRiderEnRoute && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-50 dark:bg-secondary-900/30">
                <CheckCircle2 className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Map/tracking visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, ...springs.enter }}
        >
          {(data.deliveryPartnerLocation ||
            ["OUT_FOR_DELIVERY", "ARRIVING", "READY_FOR_DELIVERY"].includes(data.status)) ? (
            <DeliveryMap
              deliveryPartnerLocation={data.deliveryPartnerLocation}
              customerLocation={data.destination}
              storeLocation={{ latitude: data.storeLatitude, longitude: data.storeLongitude }}
              className="shadow-md"
              etaMinutes={etaMinutes}
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
              </motion.div>
              {/* Pulse rings around the delivery icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-24 w-24 rounded-full border-2 border-secondary-400/30 animate-ping" style={{ animationDuration: "2s" }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* ETA countdown section - conditionally rendered using isDeliveryEtaVisible */}
        <DeliveryEtaTracking
          status={data.status}
          etaMinutes={etaMinutes}
          isDelivered={isDelivered}
        />
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

        {/* Order status timeline - enhanced 7-step version */}
        <OrderTimeline
          currentStatus={data.status}
          distanceKm={riderDistanceKm}
          etaMinutes={etaMinutes}
          updatedAt={data.updatedAt}
        />

        {/* Order Bill section */}
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
