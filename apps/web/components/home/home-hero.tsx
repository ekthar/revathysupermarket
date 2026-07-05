"use client";

import Link from "next/link";
import { ArrowRight, Bike, CreditCard, Search } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { durations } from "@/lib/motion";
import { Button } from "@/components/ui/button";

type HomeHeroProps = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  deliveryRadiusKm: number;
  gstEnabled: boolean;
};

export function HomeHero({ title, subtitle, href, image, deliveryRadiusKm }: HomeHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-neutral-900">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${image}")` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/60 to-neutral-900/90" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durations.normal }}
          className="max-w-lg"
        >
          {/* Delivery badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <Bike className="h-3.5 w-3.5" />
            Delivery within {deliveryRadiusKm} KM
          </span>

          <h1 className="mt-4 font-display text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-white/80 sm:text-base">
            {subtitle}
          </p>

          {/* Quick stats */}
          <div className="mt-5 flex items-center gap-4 text-xs font-semibold text-white/70">
            <span className="flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" />
              COD & UPI
            </span>
            <span className="h-3 w-px bg-white/30" />
            <span>50+ Products</span>
            <span className="h-3 w-px bg-white/30" />
            <span>{deliveryRadiusKm} KM radius</span>
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="h-12 rounded-xl text-sm font-bold">
              <Link href={href}>
                Start Shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12 rounded-xl border-white/20 bg-white/10 text-sm font-bold text-white backdrop-blur hover:bg-white/20">
              <Link href="/products">
                <Search className="h-4 w-4" />
                Browse All
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
