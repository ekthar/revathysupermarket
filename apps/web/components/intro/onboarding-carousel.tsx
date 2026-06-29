"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { MapPin, MessageCircle, Banknote, ChevronRight } from "lucide-react";

const ONBOARDED_KEY = "msm_onboarded_v1";
const SWIPE_THRESHOLD = 50;

interface OnboardingSlide {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: MapPin,
    iconColor: "text-brand-leaf",
    iconBg: "bg-secondary-50",
    title: "Delivery in 5 KM",
    description: "We deliver fresh groceries within a 5 kilometer radius of our store. Fast, reliable, and always fresh.",
  },
  {
    icon: MessageCircle,
    iconColor: "text-secondary-500",
    iconBg: "bg-secondary-50",
    title: "WhatsApp Order Tracking",
    description: "Get real-time updates on your order via WhatsApp. Know exactly when your groceries will arrive.",
  },
  {
    icon: Banknote,
    iconColor: "text-brand-saffron",
    iconBg: "bg-orange-50",
    title: "COD + UPI on Delivery",
    description: "Pay with cash or scan UPI at your doorstep. No upfront online payment required.",
  },
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

/**
 * Onboarding carousel shown only on first-ever visit.
 * 3 slides with swipe gestures and page-curl-like transition.
 * Persists completion in LocalStorage (msm_onboarded_v1).
 */
export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleComplete = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {}
    onComplete();
  }, [onComplete]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD && currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else if (info.offset.x > SWIPE_THRESHOLD && currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  const isLastSlide = currentSlide === slides.length - 1;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      rotateY: dir > 0 ? -15 : 15,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      rotateY: dir > 0 ? 15 : -15,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[190] bg-background flex flex-col"
    >
      {/* Skip button */}
      <div className="flex justify-end p-4 pt-safe">
        <button
          onClick={handleComplete}
          className="text-caption font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 min-h-touch"
          aria-label="Skip onboarding"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 relative overflow-hidden perspective-1000">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center cursor-grab active:cursor-grabbing"
            style={{ perspective: "1000px", willChange: "transform, opacity" }}
          >
            <SlideContent slide={slides[currentSlide]} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + action button */}
      <div className="px-6 pb-safe space-y-6 pb-8">
        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="p-1"
            >
              <motion.div
                animate={{
                  width: i === currentSlide ? 24 : 8,
                  backgroundColor: i === currentSlide ? "#050505" : "#D1D5DB",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="h-2 rounded-full"
              />
            </button>
          ))}
        </div>

        {/* Action button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={isLastSlide ? handleComplete : () => goToSlide(currentSlide + 1)}
          className="w-full min-h-touch h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-body flex items-center justify-center gap-2 shadow-elevation-2 active:shadow-elevation-1 transition-shadow"
        >
          {isLastSlide ? "Get Started" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function SlideContent({ slide }: { slide: OnboardingSlide }) {
  const Icon = slide.icon;
  return (
    <>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className={`w-20 h-20 rounded-3xl ${slide.iconBg} flex items-center justify-center mb-8`}
      >
        <Icon className={`h-9 w-9 ${slide.iconColor}`} strokeWidth={2} />
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-heading font-black text-foreground"
      >
        {slide.title}
      </motion.h2>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-3 text-body text-muted-foreground max-w-xs leading-relaxed"
      >
        {slide.description}
      </motion.p>
    </>
  );
}

/**
 * Check if onboarding should be shown (first-ever visit).
 */
export function shouldShowOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) !== "1";
  } catch {
    return false;
  }
}
