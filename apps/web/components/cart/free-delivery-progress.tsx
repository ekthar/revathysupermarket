"use client";

import { Truck } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { springs } from "@/lib/motion";

export function FreeDeliveryProgress({
  subtotal,
  threshold,
}: {
  subtotal: number;
  threshold: number;
}) {
  if (threshold <= 0) return null;

  const qualified = subtotal >= threshold;
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-3.5 shadow-elevation-2">
      <div className="flex items-center gap-2.5 mb-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            qualified
              ? "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
          }`}
        >
          <Truck className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          {qualified ? (
            <p className="text-caption font-bold text-secondary-700 dark:text-secondary-300">
              You unlocked free delivery!
            </p>
          ) : (
            <p className="text-caption font-bold text-foreground">
              Add {formatCurrency(remaining)} more for free delivery
            </p>
          )}
          <p className="text-micro text-muted-foreground">
            Free delivery above {formatCurrency(threshold)}
          </p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${qualified ? "bg-secondary-500" : "bg-amber-500"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={springs.gentle}
        />
      </div>
    </div>
  );
}
