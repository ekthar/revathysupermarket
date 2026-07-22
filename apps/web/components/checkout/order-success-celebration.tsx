"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Package, ShoppingBag } from "lucide-react";
import { springs, tapScale } from "@/lib/motion";
import { haptic } from "@/lib/haptics";

/**
 * OrderSuccessCelebration — full-screen celebration after order placement.
 *
 * Inspired by Uber Eats / Swiggy order confirmation:
 * - Large animated checkmark with scale-in entrance
 * - CSS confetti burst (no heavy library)
 * - Order number + delivery ETA prominently displayed
 * - Two clear CTAs: "Track Order" (primary) + "Browse More" (secondary)
 * - Auto-navigates to tracking after 5s (like Swiggy)
 *
 * This moment should feel REWARDING — it's the culmination of the user's
 * shopping journey and the last impression before they wait for delivery.
 */
export function OrderSuccessCelebration({
  orderNumber,
  orderId,
  estimatedMinutes,
  onClose,
}: {
  orderNumber: string;
  orderId: string;
  estimatedMinutes?: number;
  onClose?: () => void;
}) {
  const confettiRef = useRef<HTMLDivElement>(null);

  // Haptic celebration on mount
  useEffect(() => {
    haptic("heavy");
    // Auto-redirect to tracking after 5s
    const timer = setTimeout(() => {
      window.location.href = `/track/${orderId}`;
    }, 5000);
    return () => clearTimeout(timer);
  }, [orderId]);

  // Generate confetti particles
  useEffect(() => {
    if (!confettiRef.current) return;
    const container = confettiRef.current;
    const colors = ["#22C55E", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div");
      particle.className = "confetti-particle";
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        left: ${Math.random() * 100}%;
        top: -10px;
        animation: confettiFall ${Math.random() * 2 + 2}s cubic-bezier(0.25, 0.1, 0.25, 1) ${Math.random() * 0.5}s forwards;
        opacity: 0;
      `;
      container.appendChild(particle);
    }

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-neutral-950 px-6"
    >
      {/* Confetti container */}
      <div ref={confettiRef} className="absolute inset-0 overflow-hidden pointer-events-none" />

      {/* Checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...springs.enter, delay: 0.2 }}
        className="relative"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary-500 shadow-lg shadow-secondary-500/30">
          <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
        </div>
        {/* Ring animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-4 border-secondary-500"
        />
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.enter, delay: 0.5 }}
        className="mt-8 text-center"
      >
        <h1 className="font-display text-2xl font-black text-neutral-900 dark:text-white">
          Order Placed!
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Order #{orderNumber}
        </p>
      </motion.div>

      {/* ETA Card */}
      {estimatedMinutes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.enter, delay: 0.7 }}
          className="mt-6 flex items-center gap-3 rounded-2xl bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-100 dark:border-secondary-800 px-5 py-3"
        >
          <Clock className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">
              ~{estimatedMinutes} min delivery
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              We&apos;ll notify you when it&apos;s on the way
            </p>
          </div>
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.enter, delay: 0.9 }}
        className="mt-8 w-full max-w-xs space-y-3"
      >
        <motion.div whileTap={tapScale.primary}>
          <Link
            href={`/track/${orderId}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 dark:bg-white text-sm font-bold text-white dark:text-neutral-900 shadow-lg press"
          >
            <Package className="h-4 w-4" />
            Track Order
          </Link>
        </motion.div>
        <motion.div whileTap={tapScale.primary}>
          <Link
            href="/products"
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 press"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </motion.div>
      </motion.div>

      {/* Auto-redirect notice */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-6 text-xs text-neutral-400 dark:text-neutral-500"
      >
        Redirecting to tracking in 5 seconds...
      </motion.p>
    </motion.div>
  );
}
