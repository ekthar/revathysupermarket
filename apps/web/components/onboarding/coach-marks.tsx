"use client";

/**
 * Contextual Coach Marks — Subtle inline tooltips
 * ════════════════════════════════════════════════
 *
 * After the main onboarding dismisses, these coach marks appear
 * ONE AT A TIME next to key UI elements to guide the user.
 * They auto-dismiss after interaction or timeout.
 *
 * Rules:
 * - Only show after main onboarding is completed
 * - One at a time, sequential
 * - Dismiss on click anywhere or after 8s
 * - Max 3 total per session
 * - Never shown again after all 3 complete
 */

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Search, ShoppingBag, MapPin } from "lucide-react";
import { springs, tapScale } from "@/lib/motion";

const STORAGE_KEY = "msm:coach-marks:v1";
const ONBOARDING_KEY = "msm:welcome-onboarding:v2";

interface CoachMark {
  id: string;
  selector: string; // CSS selector to anchor near
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "below-header" | "above-nav" | "center";
}

const coachMarks: CoachMark[] = [
  {
    id: "search",
    selector: "[aria-label='Search products']",
    title: "Find anything instantly",
    description: "Search 500+ products by name, category, or brand.",
    icon: <Search className="h-4 w-4 text-emerald-500" />,
    position: "below-header",
  },
  {
    id: "cart",
    selector: "[data-cart-icon]",
    title: "Your cart saves automatically",
    description: "Items persist across sessions. Pick up where you left off.",
    icon: <ShoppingBag className="h-4 w-4 text-violet-500" />,
    position: "below-header",
  },
  {
    id: "location",
    selector: "[aria-label='Change delivery location']",
    title: "Set your delivery area",
    description: "We'll show delivery time estimates for your location.",
    icon: <MapPin className="h-4 w-4 text-amber-500" />,
    position: "below-header",
  },
];

export function CoachMarks() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [currentMark, setCurrentMark] = useState<CoachMark | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  // Only show on main customer routes
  const isCustomerRoute =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/staff") &&
    !pathname.startsWith("/delivery") &&
    pathname !== "/login" &&
    pathname !== "/welcome";

  useEffect(() => {
    if (!isCustomerRoute) return;

    // Only show coach marks after main onboarding is done
    const onboardingDone = localStorage.getItem(ONBOARDING_KEY);
    if (!onboardingDone) return;

    const completed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setCompletedIds(completed);

    // Find next uncompleted coach mark
    const next = coachMarks.find((m) => !completed.includes(m.id));

    if (next) {
      // Delay to let page settle
      const timer = setTimeout(() => {
        setCurrentMark(next);
        setReady(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCustomerRoute, pathname]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!currentMark) return;
    const timer = setTimeout(() => dismiss(), 8000);
    return () => clearTimeout(timer);
  }, [currentMark]);

  const dismiss = useCallback(() => {
    if (!currentMark) return;
    const newCompleted = [...completedIds, currentMark.id];
    setCompletedIds(newCompleted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCompleted));
    setCurrentMark(null);

    // Show next after a delay
    const next = coachMarks.find((m) => !newCompleted.includes(m.id));
    if (next) {
      setTimeout(() => setCurrentMark(next), 5000);
    }
  }, [currentMark, completedIds]);

  if (!ready || !isCustomerRoute || !currentMark) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={currentMark.id}
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={springs.enter}
        className="fixed top-[80px] right-4 md:right-8 z-[85] max-w-xs"
        onClick={dismiss}
      >
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-900/10 dark:shadow-neutral-900/40 border border-neutral-100 dark:border-neutral-800 p-4 cursor-pointer group hover:shadow-2xl transition-shadow">
          {/* Pointer arrow */}
          <div className="absolute -top-1.5 right-8 w-3 h-3 rotate-45 bg-white dark:bg-neutral-900 border-l border-t border-neutral-100 dark:border-neutral-800" />

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-800">
              {currentMark.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-neutral-900 dark:text-white">
                {currentMark.title}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {currentMark.description}
              </p>
            </div>
          </div>

          {/* Dismiss hint */}
          <p className="mt-2.5 text-[10px] font-medium text-neutral-400 text-center group-hover:text-neutral-500 transition-colors">
            Tap to dismiss
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1 mt-1.5">
            {coachMarks.map((m) => (
              <div
                key={m.id}
                className={`h-1 rounded-full transition-all ${
                  m.id === currentMark.id
                    ? "w-4 bg-neutral-900 dark:bg-white"
                    : completedIds.includes(m.id)
                    ? "w-1.5 bg-neutral-300 dark:bg-neutral-600"
                    : "w-1.5 bg-neutral-200 dark:bg-neutral-700"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
