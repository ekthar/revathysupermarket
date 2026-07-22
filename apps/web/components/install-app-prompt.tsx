"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Zap, Wifi, Bell } from "lucide-react";
import { springs, tapScale } from "@/lib/motion";
import { haptic } from "@/lib/haptics";

/**
 * SmartInstallPrompt — intelligent PWA install banner with engagement-based timing.
 *
 * Shows the install prompt only when the user is engaged enough to benefit:
 * - After 2+ page navigations (they're browsing, not bouncing)
 * - After 45+ seconds on site (they're interested)
 * - OR after adding an item to cart (strong purchase intent)
 *
 * Respects user choice:
 * - Dismissed → hidden for 7 days (localStorage)
 * - Already installed → never shown
 * - Native Capacitor → never shown
 *
 * Uses the `beforeinstallprompt` event to trigger the native Chrome install dialog
 * when the user taps "Install". Falls back to manual instructions on iOS Safari.
 */

const DISMISS_KEY = "msm-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_PAGE_VIEWS = 2;
const MIN_TIME_ON_SITE_MS = 45_000; // 45 seconds

export function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef<any>(null);
  const pageViewsRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  // Check eligibility on mount
  useEffect(() => {
    // Skip if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    // Skip if native Capacitor shell
    if ((window as any).Capacitor?.isNativePlatform?.()) return;

    // Skip if recently dismissed
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DURATION_MS) return;

    // Detect iOS (no beforeinstallprompt, needs manual instructions)
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Capture beforeinstallprompt (Chrome/Edge/Samsung)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      checkEngagement();
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Track page views via pathname changes
    const observer = new MutationObserver(() => {
      pageViewsRef.current++;
      checkEngagement();
    });
    observer.observe(document.querySelector("title") || document.head, {
      subtree: true, characterData: true, childList: true,
    });

    // Timer: check after minimum time on site
    const timer = setTimeout(() => checkEngagement(), MIN_TIME_ON_SITE_MS);

    // Listen for cart-add events (strong intent signal)
    const handleCartAdd = () => {
      pageViewsRef.current = MIN_PAGE_VIEWS; // Treat as sufficient engagement
      checkEngagement();
    };
    window.addEventListener("msm:cart-item-added", handleCartAdd);

    // Also listen for the legacy install trigger
    const handleLegacyInstall = () => showPrompt();
    window.addEventListener("msm:install-app", handleLegacyInstall);

    // For iOS: show after engagement even without beforeinstallprompt
    if (ios) {
      const iosTimer = setTimeout(() => checkEngagement(), MIN_TIME_ON_SITE_MS);
      return () => {
        clearTimeout(iosTimer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("msm:cart-item-added", handleCartAdd);
        window.removeEventListener("msm:install-app", handleLegacyInstall);
        observer.disconnect();
        clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("msm:cart-item-added", handleCartAdd);
      window.removeEventListener("msm:install-app", handleLegacyInstall);
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const checkEngagement = useCallback(() => {
    const timeOnSite = Date.now() - startTimeRef.current;
    const hasEnoughViews = pageViewsRef.current >= MIN_PAGE_VIEWS;
    const hasEnoughTime = timeOnSite >= MIN_TIME_ON_SITE_MS;

    // Show if either condition met AND (has deferred prompt OR is iOS)
    if ((hasEnoughViews || hasEnoughTime) && (deferredPromptRef.current || isIOS)) {
      showPrompt();
    }
  }, [isIOS]);

  const showPrompt = useCallback(() => {
    setVisible(true);
  }, []);

  const handleInstall = useCallback(async () => {
    haptic("medium");

    if (deferredPromptRef.current) {
      // Chrome/Edge: trigger native install dialog
      deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      deferredPromptRef.current = null;

      if (outcome === "accepted") {
        setVisible(false);
        // Don't save dismiss — they installed!
      } else {
        handleDismiss();
      }
    } else {
      // iOS: can't trigger programmatic install — show instructions
      // The banner itself shows iOS instructions when isIOS is true
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={springs.enter}
          className="fixed bottom-[calc(var(--mobile-nav-height,82px)+1rem+var(--safe-bottom,0px))] inset-x-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
        >
          <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-900/10 dark:shadow-neutral-900/50 border border-neutral-100 dark:border-neutral-800 p-4 relative">
            {/* Dismiss button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Content */}
            <div className="pr-8">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Install the app
              </h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Get a faster, native experience with offline access.
              </p>
            </div>

            {/* Benefits */}
            <div className="mt-3 flex items-center gap-3">
              <Benefit icon={<Zap className="h-3 w-3" />} text="2x faster" />
              <Benefit icon={<Wifi className="h-3 w-3" />} text="Works offline" />
              <Benefit icon={<Bell className="h-3 w-3" />} text="Order alerts" />
            </div>

            {/* Install CTA */}
            <motion.button
              type="button"
              onClick={handleInstall}
              whileTap={tapScale.primary}
              transition={springs.tap}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-sm font-bold text-white dark:text-neutral-900 press"
            >
              <Download className="h-4 w-4" />
              {isIOS ? "Add to Home Screen" : "Install App"}
            </motion.button>

            {/* iOS instructions */}
            {isIOS && (
              <p className="mt-2 text-center text-[11px] text-neutral-400">
                Tap <span className="inline-block translate-y-px">⎙</span> Share then "Add to Home Screen"
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1">
      <span className="text-secondary-600 dark:text-secondary-400">{icon}</span>
      <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">{text}</span>
    </div>
  );
}
