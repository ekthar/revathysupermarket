"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper, X } from "lucide-react";
import { springs } from "@/lib/motion";
import { Confetti } from "@/components/ui/confetti";

const STORAGE_KEY = "msm-first-order-celebrated";

/**
 * Shows a celebration overlay when the user places their first order.
 * Call `triggerCelebration()` after a successful order placement.
 */
export function useFirstOrderCelebration() {
  const [show, setShow] = useState(false);

  function triggerCelebration() {
    if (typeof window === "undefined") return;
    const celebrated = localStorage.getItem(STORAGE_KEY);
    if (!celebrated) {
      setShow(true);
      localStorage.setItem(STORAGE_KEY, "true");
    }
  }

  function dismiss() {
    setShow(false);
  }

  return { show, triggerCelebration, dismiss };
}

export function FirstOrderCelebration({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  useEffect(() => {
    if (show) {
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <Confetti />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={springs.enter}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl relative"
          >
            <button
              onClick={onDismiss}
              aria-label="Close"
              className="absolute top-4 right-4 h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springs.enter, delay: 0.2 }}
              className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center"
            >
              <PartyPopper className="h-8 w-8 text-yellow-600" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.enter, delay: 0.3 }}
              className="mt-5 font-display text-2xl font-black text-slate-900 dark:text-white"
            >
              Welcome to the family!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.enter, delay: 0.4 }}
              className="mt-2 text-sm text-slate-500 dark:text-slate-400"
            >
              Your first order is on its way. We&apos;re thrilled to have you!
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.enter, delay: 0.5 }}
              onClick={onDismiss}
              className="mt-5 h-11 px-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold press"
            >
              Awesome, thanks!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
