"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { lockDocumentScroll } from "@/lib/document-scroll-lock";

const STORAGE_KEY = "msm-onboarding-done";

type TourStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "center" | "top" | "bottom";
};

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome! 👋",
    description: "We deliver fresh groceries straight to your door. Let us show you around.",
    icon: <Sparkles className="h-6 w-6 text-yellow-500" />,
    position: "center"
  },
  {
    id: "browse",
    title: "Browse Products",
    description: "Tap 'Browse' to explore categories, filter by price, and search for anything you need.",
    icon: <Search className="h-6 w-6 text-primary" />,
    position: "bottom"
  },
  {
    id: "cart",
    title: "Add to Cart",
    description: "Tap the + button on any product to add it. Your cart floats at the bottom with the total.",
    icon: <ShoppingBag className="h-6 w-6 text-primary" />,
    position: "center"
  },
  {
    id: "checkout",
    title: "Quick Checkout",
    description: "We save your address for next time. Just verify your location and place the order!",
    icon: <ArrowRight className="h-6 w-6 text-primary" />,
    position: "center"
  }
];

export function OnboardingTour() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  // This tour walks through customer shopping flows (browse/cart/checkout).
  // It has no business appearing for staff/admin/delivery roles or on their
  // routes — a delivery partner should never see a "Browse Products" tour.
  const isCustomerRoute =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/staff") &&
    !pathname.startsWith("/delivery") &&
    pathname !== "/login" &&
    pathname !== "/welcome";

  useEffect(() => {
    if (!isCustomerRoute) return;
    // Only show for new users who haven't seen the tour
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isCustomerRoute]);

  useEffect(() => {
    if (!show) return;
    return lockDocumentScroll();
  }, [show]);

  if (!isCustomerRoute) return null;

  function next() {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }

  const currentStep = tourSteps[step];
  const isLast = step === tourSteps.length - 1;
  const progress = ((step + 1) / tourSteps.length) * 100;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl relative"
          >
            {/* Close button */}
            <button
              type="button"
              aria-label="Close onboarding tour"
              onClick={dismiss}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>

            {/* Progress bar */}
            <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
            >
              {currentStep.icon}
            </motion.div>

            {/* Content */}
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {currentStep.title}
            </h3>
            <p className="mt-2 text-body text-slate-600 dark:text-slate-400 leading-relaxed">
              {currentStep.description}
            </p>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={dismiss}
                className="text-body font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Skip tour
              </button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={next}
                className="flex items-center gap-2 h-11 px-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-body font-bold press"
              >
                {isLast ? "Get Started" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {tourSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === step ? "w-4 bg-primary" : "w-1.5 bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
