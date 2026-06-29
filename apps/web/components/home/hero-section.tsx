"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronUp } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function HeroSection({
  storeName,
  heroImage,
  heroTitle,
  heroHref,
  deliveryRadiusKm
}: {
  storeName: string;
  heroImage: string;
  heroTitle: string;
  heroHref: string;
  deliveryRadiusKm: number;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Disable parallax transforms when user prefers reduced motion
  const imageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 80]);
  const textY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -30]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5], reduceMotion ? [1, 1] : [1, 1.05]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.6]);

  return (
    <>
      {/* Hero Section - Desktop with Parallax */}
      <section ref={heroRef} className="hidden md:block relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-8 items-center">
            {/* Left: Text content with parallax */}
            <motion.div style={{ y: textY, opacity }}>
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                className="font-display text-5xl lg:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight text-neutral-900 dark:text-white"
              >
                {storeName}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.25 }}
                className="mt-5 text-lg text-neutral-600 dark:text-neutral-300 max-w-md leading-relaxed"
              >
                Shop from thousands of farm-fresh fruits, vegetables, dairy and daily essentials at unbeatable prices.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.4 }}
              >
                <Link
                  href={heroHref}
                  className="show-all-pill mt-8 inline-flex"
                >
                  Shop Now
                  <ChevronUp className="h-4 w-4 rotate-90" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: Hero image with parallax */}
            <motion.div
              style={{ y: imageY, scale: imageScale }}
              className="relative aspect-[4/3] rounded-3xl overflow-hidden"
            >
              <Image
                src={heroImage}
                alt={heroTitle}
                fill
                sizes="50vw"
                className="h-full w-full object-cover"
                priority
                fetchPriority="high"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
              />

              {/* Floating product card with bob animation */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.6 }}
                className="absolute top-6 right-6"
              >
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white dark:bg-neutral-900 rounded-2xl p-3 shadow-lg max-w-[160px]"
                >
                  <Image
                    src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&h=80&fit=crop"
                    alt="Fresh Vegetables"
                    width={136}
                    height={64}
                    className="h-16 w-full rounded-xl object-cover"
                  />
                  <p className="mt-2 text-caption font-bold text-neutral-800">Fresh Vegetables</p>
                  <p className="text-caption font-bold text-primary">₹18.00</p>
                </motion.div>
              </motion.div>

              {/* Secondary floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.9 }}
                className="absolute bottom-8 left-6"
              >
                <motion.div
                  animate={{ y: [3, -3, 3], rotate: [-1, 1, -1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-primary text-white rounded-full px-4 py-2 text-caption font-bold shadow-premium"
                >
                  Same-Day Delivery
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hero banner - Mobile — NO initial opacity:0 to preserve LCP paint */}
      <section className="px-4 pt-3 pb-1 md:hidden">
        <Link href={heroHref} className="block relative overflow-hidden rounded-2xl aspect-[2.2/1] press">
          <Image
            src={heroImage}
            alt={heroTitle}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-full w-full object-cover"
            priority
            fetchPriority="high"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjM2NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0 p-4"
          >
            <span className="inline-block text-micro font-semibold text-white/90 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 mb-1.5">
              {deliveryRadiusKm} KM delivery
            </span>
            <h2 className="text-title font-bold text-white leading-snug">{heroTitle}</h2>
          </motion.div>
        </Link>
      </section>
    </>
  );
}
