"use client";

import { Clock, Truck } from "lucide-react";

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
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 ${className}`}>
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
        <p className="text-[12px] font-semibold text-slate-800 dark:text-white">
          Delivery in {minMinutes}-{maxMinutes} min
        </p>
        <p className="text-[10px] text-slate-400">Free delivery on orders above ₹500</p>
      </div>
    </div>
  );
}
