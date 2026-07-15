"use client";

import { motion } from "framer-motion";
import { springs } from "@/lib/motion";
import { timeAgo } from "@msm/shared";
import {
  ShoppingBag,
  ThumbsUp,
  Package,
  PackageCheck,
  Truck,
  MapPin,
  CheckCircle2,
  CircleDot,
  Clock,
} from "lucide-react";

// ─── 7-Step Timeline Definition ───────────────────────────────────────────────

export const TIMELINE_STEPS = [
  {
    key: "ORDER_RECEIVED",
    label: "Order received",
    subtitle: "We got it. The store is reviewing.",
    icon: ShoppingBag,
  },
  {
    key: "ACCEPTED",
    label: "Order accepted",
    subtitle: "Confirmed and queued for packing.",
    icon: ThumbsUp,
  },
  {
    key: "PACKING",
    label: "Packing your bag",
    subtitle: "Hand-picked items, carefully packed.",
    icon: Package,
  },
  {
    key: "READY_FOR_DELIVERY",
    label: "Ready for delivery",
    subtitle: "Packed and waiting for a rider.",
    icon: PackageCheck,
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    subtitle: "Your rider is on the way.",
    icon: Truck,
  },
  {
    key: "ARRIVING",
    label: "Arriving",
    subtitle: "Almost at your doorstep!",
    icon: MapPin,
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    subtitle: "Enjoy your fresh groceries!",
    icon: CheckCircle2,
  },
] as const;

export type TimelineStepKey = (typeof TIMELINE_STEPS)[number]["key"];

// ─── Step Index Resolution ────────────────────────────────────────────────────

/**
 * Maps any order status string to the corresponding timeline step index (0-6).
 */
export function getTimelineStepIndex(status: string): number {
  switch (status) {
    case "ORDER_RECEIVED":
    case "AWAITING_CUSTOMER_APPROVAL":
      return 0;
    case "ACCEPTED":
      return 1;
    case "PACKING":
      return 2;
    case "READY_FOR_DELIVERY":
      return 3;
    case "OUT_FOR_DELIVERY":
      return 4;
    case "ARRIVING":
      return 5;
    case "DELIVERED":
      return 6;
    default:
      return 0;
  }
}

/**
 * Returns a human-readable label for any order status.
 */
export function getTimelineStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ORDER_RECEIVED: "Order received",
    AWAITING_CUSTOMER_APPROVAL: "Awaiting approval",
    ACCEPTED: "Order accepted",
    PACKING: "Packing your bag",
    READY_FOR_DELIVERY: "Ready for delivery",
    OUT_FOR_DELIVERY: "Out for delivery",
    ARRIVING: "Arriving soon",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return map[status] || status;
}

// ─── Timeline Component ───────────────────────────────────────────────────────

type OrderTimelineProps = {
  currentStatus: string;
  /** Optional: show distance to customer when rider is en route */
  distanceKm?: number | null;
  /** Optional: ETA in minutes */
  etaMinutes?: number | null;
  /** Optional: order updatedAt timestamp (ISO string) for "Last updated" display */
  updatedAt?: string | null;
};

export function OrderTimeline({ currentStatus, distanceKm, etaMinutes, updatedAt }: OrderTimelineProps) {
  const currentStep = getTimelineStepIndex(currentStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.enter, delay: 0.45 }}
      className="rounded-2xl bg-white p-5 card-shadow dark:bg-neutral-900"
    >
      <div className="flex items-center justify-between mb-5">
        <p className="text-caption font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Order Status
        </p>
        {updatedAt && (
          <span className="inline-flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
            <Clock className="h-3 w-3" />
            Last updated: {timeAgo(updatedAt)}
          </span>
        )}
      </div>
      <div className="space-y-0">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const StepIcon = step.icon;

          // Show distance badge on OUT_FOR_DELIVERY step when rider is en route
          const showDistance =
            step.key === "OUT_FOR_DELIVERY" &&
            isCurrent &&
            distanceKm != null &&
            distanceKm > 0;

          // Show ETA badge on ARRIVING step when arriving
          const showEta =
            step.key === "ARRIVING" && isCurrent && etaMinutes != null;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.enter, delay: 0.5 + index * 0.08 }}
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
                {index < TIMELINE_STEPS.length - 1 && (
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
                {/* Distance badge */}
                {showDistance && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs font-semibold text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400">
                    <Truck className="h-3 w-3" />
                    {distanceKm.toFixed(1)} km away
                  </span>
                )}
                {/* ETA badge */}
                {showEta && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs font-semibold text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400">
                    <MapPin className="h-3 w-3" />
                    ~{etaMinutes} min away
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
