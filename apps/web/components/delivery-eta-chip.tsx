"use client";

import { Zap } from "lucide-react";
import { useStoreConfig } from "@/lib/use-store-config";
import { cn } from "@/lib/utils";

/**
 * DeliveryEtaChip — per-card delivery estimate.
 *
 * The strongest trust signal in quick commerce: every card states how fast it
 * arrives. Reads from the shared store config (module-cached, so rendering it on
 * every card in a grid costs one request for the whole page).
 *
 * Shows the full min–max range rather than just the fast end, so the chip agrees
 * with the delivery promise bar and the checkout estimate.
 */
export function DeliveryEtaChip({ className }: { className?: string }) {
  const { deliveryEstimateMin, deliveryEstimateMax } = useStoreConfig();

  if (!deliveryEstimateMin || !deliveryEstimateMax) return null;

  const label =
    deliveryEstimateMin === deliveryEstimateMax
      ? `${deliveryEstimateMin} min`
      : `${deliveryEstimateMin}–${deliveryEstimateMax} min`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-white/90 dark:bg-neutral-900/90 px-1.5 py-0.5 backdrop-blur-sm",
        "text-micro font-bold text-neutral-700 dark:text-neutral-200 tabular-nums",
        className
      )}
    >
      <Zap className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
