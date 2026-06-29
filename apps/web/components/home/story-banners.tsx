"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type StoryBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  href?: string | null;
  endsAt?: string | null;
  couponCode?: string | null;
  badge?: string | null;
};

const STORY_DURATION_MS = 5000; // 5s per story
const GRADIENT_PRESETS = [
  "from-orange-600 via-amber-500 to-yellow-400",
  "from-emerald-600 via-green-500 to-lime-400",
  "from-violet-600 via-purple-500 to-fuchsia-400",
  "from-rose-600 via-pink-500 to-red-400",
  "from-cyan-600 via-teal-500 to-emerald-400",
];

interface StoryBannersProps {
  banners: StoryBanner[];
}

/**
 * Swiggy-level Story Banner Carousel
 * 
 * Features:
 * - Full-bleed cards with gradient overlays
 * - Auto-advance with progress bar per card (Instagram-style)
 * - Pause on touch/hover
 * - Live countdown timer for expiring offers
 * - Tappable coupon code with clipboard copy + haptic
 * - Smooth slide transition between stories
 */
export function StoryBanners({ banners }: StoryBannersProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startTimeRef = useRef(Date.now());

  const count = banners.length;

  const advance = useCallback(() => {
    if (count === 0) return;
    setActive((prev) => (prev + 1) % count);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [count]);

  // Auto-advance timer
  useEffect(() => {
    if (paused || count === 0) return;
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / STORY_DURATION_MS, 1);
      setProgress(pct);
      if (pct >= 1) advance();
    }, 50);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, paused, advance, count]);

  if (count === 0) return null;

  const goTo = (index: number) => {
    setActive(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  const banner = banners[active];

  return (
    <section
      className="relative mx-4 mt-4 overflow-hidden rounded-3xl md:mx-0 md:rounded-none md:mt-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      aria-label="Promotional offers"
      role="region"
    >
      {/* Progress dots — Instagram style */}
      <div className="absolute top-3 left-4 right-4 z-20 flex gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to offer ${i + 1}`}
            className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
              style={{
                width: i < active ? "100%" : i === active ? `${progress * 100}%` : "0%",
              }}
            />
          </button>
        ))}
      </div>

      {/* Banner content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "relative aspect-[2/1] sm:aspect-[3/1] md:aspect-[4/1] w-full bg-gradient-to-br",
            GRADIENT_PRESETS[active % GRADIENT_PRESETS.length]
          )}
        >
          {/* Background image */}
          {banner.image && (
            <Image
              src={banner.image}
              alt=""
              fill
              sizes="100vw"
              className="object-cover mix-blend-overlay opacity-40"
              priority={active === 0}
            />
          )}

          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex h-full items-center px-6 py-8 sm:px-10 md:px-16">
            <div className="max-w-md">
              {/* Badge */}
              {banner.badge && (
                <motion.span
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                  className="inline-block mb-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-micro font-black uppercase tracking-wide"
                >
                  {banner.badge}
                </motion.span>
              )}

              {/* Title */}
              <motion.h2
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="font-display text-heading sm:text-display font-black text-white leading-tight"
              >
                {banner.title}
              </motion.h2>

              {/* Subtitle */}
              {banner.subtitle && (
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mt-2 text-body sm:text-base text-white/80 leading-relaxed"
                >
                  {banner.subtitle}
                </motion.p>
              )}

              {/* Coupon code + Countdown row */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-4 flex flex-wrap items-center gap-3"
              >
                {banner.couponCode && (
                  <CouponChip code={banner.couponCode} />
                )}
                {banner.endsAt && (
                  <CountdownTimer endsAt={banner.endsAt} />
                )}
              </motion.div>

              {/* CTA */}
              {banner.href && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <Link
                    href={banner.href}
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full bg-white text-sm font-bold text-neutral-900 shadow-lg hover:shadow-xl transition-shadow press"
                  >
                    Shop Now
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows (desktop) */}
      {count > 1 && (
        <div className="hidden md:flex absolute right-6 bottom-6 z-20 gap-2">
          <button
            onClick={() => goTo((active - 1 + count) % count)}
            className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition"
            aria-label="Previous"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <button
            onClick={() => goTo((active + 1) % count)}
            className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Coupon Chip — tap to copy ───────────────────────────────────────────────

function CouponChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if ("vibrate" in navigator) navigator.vibrate(15);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-dashed border-white/50 bg-white/10 backdrop-blur-sm text-white text-caption font-bold hover:bg-white/20 transition press"
      aria-label={`Copy coupon code ${code}`}
    >
      <span className="font-mono tracking-wider">{code}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-300" />
      ) : (
        <Copy className="h-3.5 w-3.5 opacity-70" />
      )}
    </button>
  );
}

// ─── Countdown Timer ─────────────────────────────────────────────────────────

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!timeLeft || timeLeft === "Expired") return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/80 backdrop-blur-sm text-white text-caption font-bold">
      <Clock className="h-3.5 w-3.5" />
      Ends in {timeLeft}
    </span>
  );
}
