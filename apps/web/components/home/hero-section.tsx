"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Bike, Clock } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useRef } from "react";
import { Sparkles } from "lucide-react";
import { SplitTextReveal } from "@/components/ui/gsap/split-text-reveal";

export function HeroSection({
  storeName,
  heroImage,
  heroTitle,
  heroHref,
  deliveryRadiusKm,
  deliveryEstimateMin = 25,
  deliveryEstimateMax = 45,
}: {
  storeName: string;
  heroImage: string;
  heroTitle: string;
  heroHref: string;
  deliveryRadiusKm: number;
  deliveryEstimateMin?: number;
  deliveryEstimateMax?: number;
}) {
  const desktopRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !desktopRef.current || !imageRef.current) return;

      const ctx = gsap.context(() => {
        // Parallax on hero image — gentle, only on desktop
        gsap.to(imageRef.current, {
          y: 40,
          ease: "none",
          scrollTrigger: {
            trigger: desktopRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 2
          }
        });

        // Floating badge bob — gentle, loops only 3 times
        if (badgeRef.current) {
          gsap.to(badgeRef.current, {
            y: -4,
            duration: 2.5,
            ease: "power1.inOut",
            yoyo: true,
            repeat: 5,
          });
        }
      }, desktopRef.current);

      return () => ctx.revert();
    },
    { scope: desktopRef }
  );

  return (
    <>
      {/* Desktop Hero */}
      <section ref={desktopRef} className="hidden md:block relative overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-8 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary-50 dark:bg-secondary-900/30 px-3.5 py-1.5 mb-4">
                <Bike className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
                <span className="text-micro font-black uppercase tracking-wider text-secondary-700 dark:text-secondary-300">
                  Delivery within {deliveryRadiusKm} KM
                </span>
              </div>

              <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl font-black leading-[0.95] text-neutral-900 dark:text-white">
                <SplitTextReveal
                  splitBy="word"
                  stagger={0.06}
                  y={24}
                  rotateX={-15}
                  duration={0.7}
                  className="font-display text-5xl lg:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight text-neutral-900 dark:text-white"
                >
                  {heroTitle}
                </SplitTextReveal>
              </h1>

              <p className="mt-5 text-lg text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
                Shop from thousands of farm-fresh fruits, vegetables, dairy and daily essentials.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={heroHref} className="show-all-pill inline-flex">
                  Shop Now
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                <Clock className="h-3.5 w-3.5" />
                Delivery in ~{deliveryEstimateMin}–{deliveryEstimateMax} mins
              </p>

              <div className="mt-4 flex items-center gap-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                <span>COD & UPI</span>
                <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
                <span>Free delivery over ₹499</span>
              </div>
            </div>

            {/* Right: image with GSAP parallax */}
            <div ref={imageRef} className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-elevation-2">
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
              <div ref={badgeRef} className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-3 py-1.5 text-caption font-bold text-neutral-700 dark:text-neutral-300 shadow-elevation-1">
                <Sparkles className="h-3.5 w-3.5 text-secondary-500" />
                Free Delivery
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Hero — delivery ETA as hero-level information */}
      <section className="px-4 pt-3 pb-2 md:hidden">
        <Link href={heroHref} className="block relative overflow-hidden rounded-2xl aspect-[2.1/1] press">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-lg font-bold text-white leading-snug">{heroTitle}</h2>
          </div>
        </Link>

        {/* Delivery ETA — THE primary information (Swiggy/Zomato pattern) */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-white px-4 py-2.5">
            <Clock className="h-4 w-4 text-secondary-400 dark:text-secondary-600" />
            <span className="text-sm font-black text-white dark:text-neutral-900">
              {deliveryEstimateMin}–{deliveryEstimateMax} min
            </span>
          </div>
          <div className="flex items-center gap-3 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
            <span>Free over ₹499</span>
            <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
            <span>COD & UPI</span>
          </div>
        </div>
      </section>
    </>
  );
}
