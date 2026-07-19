"use client";

/**
 * Announcement Bar — Dismissible top banner for deals/flash sales
 * ═══════════════════════════════════════════════════════════════
 *
 * Sits above the header. Dismissible per session.
 * Features gradient background, animated icon, and link.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Zap } from "lucide-react";
import { springs } from "@/lib/motion";

const DISMISS_KEY = "msm:announcement-dismissed";

interface AnnouncementBarProps {
  message?: string;
  href?: string;
  linkText?: string;
}

export function AnnouncementBar({
  message = "Free delivery on orders above ₹499 — Today only!",
  href = "/offers",
  linkText = "Shop deals",
}: AnnouncementBarProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setShow(true);
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setShow(false);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={springs.snappy}
          className="relative overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 z-50"
        >
          <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
            </motion.div>

            <p className="text-xs sm:text-sm font-semibold text-white/90">
              {message}
            </p>

            <Link
              href={href}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white hover:bg-white/20 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-amber-300" />
              {linkText}
            </Link>

            <button
              type="button"
              onClick={dismiss}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="h-3 w-3 text-white/60" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
