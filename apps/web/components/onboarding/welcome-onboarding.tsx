"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  CreditCard,
  Gift,
  MapPin,
  ShoppingBasket,
  Sparkles,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { springs, tapScale, stagger, easings, durations } from "@/lib/motion";
import { SITE } from "@/lib/constants";

const STORAGE_KEY = "msm:welcome-onboarding:v2";

// ─── Slide Data ───────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  gradient: string;
  icon: React.ReactNode;
  floatingElements: { icon: React.ReactNode; position: string; delay: number }[];
}

const slides: Slide[] = [
  {
    id: "fresh",
    badge: "500+ Products",
    title: "Fresh groceries,\ndelivered to you",
    subtitle: "Browse our full catalogue of farm-fresh produce, pantry staples, and everyday essentials.",
    gradient: "from-emerald-500 via-emerald-600 to-teal-700",
    icon: <ShoppingBasket className="h-8 w-8" />,
    floatingElements: [
      { icon: <span className="text-2xl">🥬</span>, position: "top-[15%] left-[8%]", delay: 0.3 },
      { icon: <span className="text-2xl">🍎</span>, position: "top-[25%] right-[12%]", delay: 0.5 },
      { icon: <span className="text-xl">🥛</span>, position: "bottom-[30%] left-[15%]", delay: 0.7 },
      { icon: <span className="text-xl">🍞</span>, position: "bottom-[20%] right-[8%]", delay: 0.9 },
    ],
  },
  {
    id: "fast",
    badge: "~30 min delivery",
    title: "Lightning fast\nto your door",
    subtitle: "Real-time order tracking with live delivery updates. Know exactly when your groceries arrive.",
    gradient: "from-violet-500 via-purple-600 to-indigo-700",
    icon: <Truck className="h-8 w-8" />,
    floatingElements: [
      { icon: <Clock className="h-5 w-5 text-white/60" />, position: "top-[20%] right-[15%]", delay: 0.4 },
      { icon: <MapPin className="h-5 w-5 text-white/60" />, position: "bottom-[25%] left-[10%]", delay: 0.6 },
      { icon: <Zap className="h-5 w-5 text-white/60" />, position: "top-[35%] left-[8%]", delay: 0.8 },
    ],
  },
  {
    id: "pay",
    badge: "Zero commitment",
    title: "Pay when it\narrives. Simple.",
    subtitle: "Cash on delivery or UPI at your doorstep. No upfront payments, no hidden fees. Just fresh food.",
    gradient: "from-amber-500 via-orange-500 to-rose-600",
    icon: <CreditCard className="h-8 w-8" />,
    floatingElements: [
      { icon: <span className="text-xl">💵</span>, position: "top-[18%] left-[12%]", delay: 0.3 },
      { icon: <Gift className="h-5 w-5 text-white/60" />, position: "bottom-[22%] right-[10%]", delay: 0.6 },
      { icon: <Sparkles className="h-5 w-5 text-white/60" />, position: "top-[30%] right-[8%]", delay: 0.9 },
    ],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function WelcomeOnboarding() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

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

  // Auto-advance slides
  useEffect(() => {
    if (!show) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [show, currentSlide]);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    } else {
      dismiss();
    }
  }, [currentSlide, dismiss]);

  if (!ready || !isCustomerRoute) return null;

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.92,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.92,
    }),
  };

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

          {/* Main Card */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
            transition={springs.enter}
            className="relative z-10 w-full max-w-lg mx-4 overflow-hidden rounded-[2rem] bg-white dark:bg-neutral-900 shadow-2xl"
          >
            {/* Close Button */}
            <motion.button
              type="button"
              onClick={dismiss}
              whileTap={tapScale.subtle}
              className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-colors hover:bg-white/30"
              aria-label="Close onboarding"
            >
              <X className="h-4 w-4" />
            </motion.button>

            {/* Slide Content Area */}
            <div className="relative h-[320px] sm:h-[360px] overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={slide.id}
                  custom={direction}
                  variants={reduceMotion ? undefined : slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={springs.enter}
                  className={`absolute inset-0 flex flex-col items-center justify-center px-8 bg-gradient-to-br ${slide.gradient}`}
                >
                  {/* Floating decorative elements */}
                  {!reduceMotion && slide.floatingElements.map((el, i) => (
                    <motion.div
                      key={i}
                      className={`absolute ${el.position}`}
                      initial={{ opacity: 0, scale: 0, y: 20 }}
                      animate={{
                        opacity: 0.8,
                        scale: 1,
                        y: [0, -8, 0],
                      }}
                      transition={{
                        opacity: { delay: el.delay, duration: 0.4 },
                        scale: { delay: el.delay, duration: 0.5, ease: easings.easeOutBack },
                        y: { delay: el.delay + 0.5, duration: 3, repeat: Infinity, ease: "easeInOut" },
                      }}
                    >
                      {el.icon}
                    </motion.div>
                  ))}

                  {/* Radial glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.2),transparent_50%)]" />

                  {/* Content */}
                  <motion.div
                    className="relative z-10 flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.enter, delay: 0.15 }}
                  >
                    {/* Icon */}
                    <motion.div
                      className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-lg shadow-black/10"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ ...springs.enter, delay: 0.2 }}
                    >
                      {slide.icon}
                    </motion.div>

                    {/* Badge */}
                    <motion.span
                      className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Sparkles className="h-3 w-3" />
                      {slide.badge}
                    </motion.span>

                    {/* Title */}
                    <motion.h2
                      className="font-display text-3xl sm:text-4xl font-black leading-tight text-white whitespace-pre-line"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      {slide.title}
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                      className="mt-3 max-w-xs text-sm leading-relaxed text-white/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                    >
                      {slide.subtitle}
                    </motion.p>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Section */}
            <div className="p-6">
              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className="relative"
                  >
                    <div className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentSlide
                        ? "w-8 bg-neutral-900 dark:bg-white"
                        : "w-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300"
                    }`} />
                    {/* Auto-advance progress indicator */}
                    {idx === currentSlide && !reduceMotion && (
                      <motion.div
                        className="absolute inset-0 h-2 rounded-full bg-neutral-900/30 dark:bg-white/30 origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 6, ease: "linear" }}
                        key={`progress-${currentSlide}`}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <motion.button
                  type="button"
                  onClick={nextSlide}
                  whileTap={tapScale.primary}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold shadow-lg shadow-neutral-900/20 transition-shadow hover:shadow-xl"
                >
                  {isLast ? "Start Shopping" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </motion.button>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    onClick={dismiss}
                    whileTap={tapScale.primary}
                    className="flex h-11 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Skip
                  </motion.button>
                  <Link
                    href="/login"
                    onClick={dismiss}
                    className="flex h-11 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              </div>

              {/* Store name */}
              <p className="mt-4 text-center text-xs text-neutral-400">
                {SITE.name} &middot; Fresh groceries, delivered fast
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
