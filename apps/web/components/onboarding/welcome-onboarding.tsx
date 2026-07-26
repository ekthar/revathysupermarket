"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { springs, tapScale, durations } from "@/lib/motion";
import { SITE } from "@/lib/constants";

const STORAGE_KEY = "msm:welcome-onboarding:v2";

// ─── Main Component ───────────────────────────────────────────────────────────

export function WelcomeOnboarding() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);

  // Only show on customer routes, not on admin/staff/delivery
  const isCustomerRoute =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/staff") &&
    !pathname.startsWith("/delivery") &&
    pathname !== "/login" &&
    pathname !== "/welcome";

  useEffect(() => {
    if (!isCustomerRoute) return;
    const seen = localStorage.getItem(STORAGE_KEY);
    setReady(true);
    if (!seen) {
      // Small delay to let the page paint first
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isCustomerRoute]);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  }, []);

  if (!ready || !isCustomerRoute) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durations.normal }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-neutral-950/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Main Card — single screen, clean white */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
            transition={springs.enter}
            className="relative z-10 w-full max-w-lg mx-4 overflow-hidden rounded-[2rem] bg-white dark:bg-neutral-900 shadow-2xl"
          >
            {/* Close Button — subtle top-right ✕ */}
            <motion.button
              type="button"
              onClick={dismiss}
              whileTap={tapScale.subtle}
              className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </motion.button>

            {/* Content */}
            <div className="px-6 pt-10 pb-6 flex flex-col items-center text-center">
              {/* Grocery image placeholder */}
              <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-6">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=450&fit=crop&q=80"
                  alt="Fresh groceries"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Store name as hero text */}
              <h2 className="font-display text-2xl font-black text-neutral-900 dark:text-white">
                {SITE.name}
              </h2>

              {/* Value prop */}
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                Farm-fresh groceries &amp; daily essentials at your doorstep
              </p>

              {/* Delivery promise pill */}
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-secondary-50 dark:bg-secondary-900/30 px-4 py-2">
                <span className="text-sm">🕐</span>
                <span className="text-caption font-bold text-secondary-700 dark:text-secondary-300">
                  Delivery in 25–45 min
                </span>
              </div>

              {/* Primary CTA */}
              <motion.button
                type="button"
                onClick={dismiss}
                whileTap={tapScale.primary}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold shadow-lg shadow-neutral-900/20 transition-shadow hover:shadow-xl"
              >
                Get Started
              </motion.button>

              {/* Sign in link */}
              <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  onClick={dismiss}
                  className="font-semibold text-neutral-900 dark:text-white underline underline-offset-2"
                >
                  Sign in
                </Link>
              </p>

              {/* Trust signals */}
              <p className="mt-5 text-xs text-neutral-400 dark:text-neutral-500">
                500+ items · Free delivery over ₹499 · COD &amp; UPI
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
