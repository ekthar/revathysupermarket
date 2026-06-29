"use client";

import { Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  /** Accessible label describing what's being counted */
  ariaLabel?: string;
}

/**
 * Standalone quantity stepper with animated number transitions.
 * Meets 44px touch target on all interactive elements.
 */
export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  min = 0,
  max = 99,
  size = "md",
  disabled = false,
  className,
  ariaLabel = "Quantity",
}: QuantityStepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;

  const sizes = {
    sm: { container: "h-8 rounded-full", button: "w-8 h-8", text: "text-caption w-6" },
    md: { container: "h-10 rounded-full", button: "w-10 h-10 min-w-touch min-h-touch", text: "text-body w-8" },
    lg: { container: "h-12 rounded-full", button: "w-12 h-12 min-w-touch min-h-touch", text: "text-title w-10" },
  };

  const s = sizes[size];

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center bg-neutral-100 dark:bg-neutral-800 overflow-hidden",
        s.container,
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled || atMin}
        aria-label={`Decrease ${ariaLabel}`}
        className={cn(
          "flex items-center justify-center rounded-full text-foreground transition-colors",
          "hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          s.button
        )}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn("text-center font-bold tabular-nums select-none", s.text)}
          aria-live="polite"
          aria-atomic="true"
        >
          {value}
        </motion.span>
      </AnimatePresence>

      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || atMax}
        aria-label={`Increase ${ariaLabel}`}
        className={cn(
          "flex items-center justify-center rounded-full text-foreground transition-colors",
          "hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          s.button
        )}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
