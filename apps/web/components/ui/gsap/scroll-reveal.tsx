"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * ScrollReveal — subtle entrance animation on scroll, GSAP-powered.
 *
 * Apple principle: NEVER flash content. Content is always visible.
 * We only animate `transform` (translateY) — never opacity from 0.
 * This means if GSAP fails to load, content is still perfectly visible
 * and positioned correctly. The animation is purely enhancement.
 *
 * On low-end devices or reduced motion: no animation at all.
 */
export function ScrollReveal({
  children,
  className,
  y = 16,
  delay = 0,
  stagger = 0,
  duration = 0.6,
  once = true,
  amount = 0.25
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  stagger?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) return; // Content stays as-is

      const targets = stagger > 0
        ? el.querySelectorAll<HTMLElement>("[data-reveal-item]")
        : [el];

      if (!targets || (targets instanceof NodeList && targets.length === 0)) return;

      const ctx = gsap.context(() => {
        // IMPORTANT: We use fromTo with immediate render OFF.
        // Content starts at its natural position (visible, no flash).
        // On scroll trigger, it animates FROM offset TO natural position.
        gsap.fromTo(targets,
          { y, opacity: 0.4 }, // Start: slightly below and faded (NOT invisible)
          {
            y: 0,
            opacity: 1,
            duration,
            delay,
            stagger,
            ease: "power2.out",
            immediateRender: false, // Critical: don't set initial state until trigger fires
            scrollTrigger: {
              trigger: el,
              start: `top ${Math.round((1 - amount) * 100)}%`,
              toggleActions: once ? "play none none none" : "play none none reverse",
              once,
            },
          }
        );
      }, el);

      return () => ctx.revert();
    },
    { scope: ref, dependencies: [y, delay, stagger, duration, once, amount] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * ScrollRevealItem — marks a child to be staggered by a parent ScrollReveal.
 */
export function ScrollRevealItem({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-reveal-item className={className}>
      {children}
    </div>
  );
}

/** Keep ScrollTrigger aware of layout changes. */
export function refreshScrollTrigger() {
  if (typeof window === "undefined") return;
  ScrollTrigger.refresh();
}
