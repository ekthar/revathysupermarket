"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type HapticButtonProps = HTMLMotionProps<"button"> & {
  haptic?: boolean;
  pressScale?: number;
};

/**
 * iOS-like press feedback button.
 * Scales down on press with a fast spring, reduces shadow,
 * and optionally triggers navigator.vibrate for haptic feedback.
 *
 * Note: navigator.vibrate() is not supported on iOS Safari (the Vibration API
 * is not implemented in WebKit). On iPhones, the press-scale animation still
 * provides visual feedback, but actual haptic vibration will only work on
 * Android devices and other supporting browsers.
 */
export const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ children, className, haptic = true, pressScale = 0.95, onTapStart, ...props }, ref) => {
    function triggerHaptic() {
      if (!haptic) return;
      try {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(10);
        }
      } catch {
        // Haptic not supported - silently ignore
      }
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: pressScale }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.8,
        }}
        onTapStart={(event, info) => {
          triggerHaptic();
          onTapStart?.(event, info);
        }}
        className={cn(
          "relative will-change-transform transition-shadow active:shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

HapticButton.displayName = "HapticButton";
