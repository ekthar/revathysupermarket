"use client";

import { Clock, Truck } from "lucide-react";
import { useStoreConfig } from "@/lib/use-store-config";
import { formatCurrency } from "@/lib/utils";

interface DeliveryEtaProps {
  minMinutes: number;
  maxMinutes: number;
  className?: string;
  compact?: boolean;
}

/**
 * Displays delivery time estimation.
 * Used on product pages, cart, checkout, and home page.
 */
export function DeliveryEta({ minMinutes, maxMinutes, className = "", compact = false }: DeliveryEtaProps) {
  const config = useStoreConfig();

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-caption font-medium text-slate-500 dark:text-slate-400 ${className}`}>
        <Clock className="h-3 w-3" />
        {minMinutes}-{maxMinutes} min
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="h-8 w-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
        <Truck className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-caption font-semibold text-slate-800 dark:text-white">
          Delivery in {minMinutes}-{maxMinutes} min
        </p>
        <p className="text-micro text-slate-400">
          From ₹30 by distance{config.freeDeliveryThreshold > 0 ? ` · free above ${formatCurrency(config.freeDeliveryThreshold)}` : ""}
        </p>
      </div>
    </div>
  );
}
