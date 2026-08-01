"use client";

import { Truck } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { springs } from "@/lib/motion";

export function FreeDeliveryProgress({
  subtotal,
  threshold,
  variant = "card",
}: {
  subtotal: number;
  threshold: number;
  /** `bar` is the compact form used inside the sticky cart summary, where the
   *  full card would eat too much of the viewport. */
  variant?: "card" | "bar";
}) {
  if (threshold <= 0) return null;

  const qualified = subtotal >= threshold;
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);

  if (variant === "bar") {
    return (
      <div
        className={`px-4 pt-2.5 pb-2 ${
          qualified ? "bg-secondary-50 dark:bg-secondary-900/25" : "bg-muted/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <Truck
            className={`h-3.5 w-3.5 shrink-0 ${
              qualified
                ? "text-secondary-600 dark:text-secondary-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          />
          <p
            className={`text-micro font-bold ${
              qualified
                ? "text-secondary-700 dark:text-secondary-300"
                : "text-foreground"
            }`}
          >
            {qualified
              ? "Free delivery unlocked"
              : `Add ${formatCurrency(remaining)} more for FREE delivery`}
          </p>
        </div>
        {!qualified && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={springs.gentle}
            />
          </div>
        )}
      </div>
    );
  }

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
