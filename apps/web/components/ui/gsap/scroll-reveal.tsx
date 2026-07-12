"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * ScrollReveal — fade/slide children into view once, GSAP-powered.
 *
 * Use for section content that should announce itself on scroll.
 * For pinning / scrubbing use StickyStack or HorizontalPan instead.
 *
 * Honors `prefers-reduced-motion`: collapses to an instant fade.
 */
export function ScrollReveal({
  children,
  className,
  y = 24,
  delay = 0,
  stagger = 0,
  duration = 0.7,
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

      if (prefersReducedMotion()) {
        gsap.set(el, { opacity: 1, y: 0 });
        return;
      }

      const targets = stagger > 0 ? el.querySelectorAll<HTMLElement>("[data-reveal-item]") : el;

      const ctx = gsap.context(() => {
        gsap.set(targets, { opacity: 0, y });
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: `top ${Math.round((1 - amount) * 100)}%`,
            toggleActions: once ? "play none none none" : "play none none reverse",
            once
          }
        });
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
 * Wrap items with this when using `stagger > 0`.
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

/** Keep ScrollTrigger aware of layout changes (cart bars, route transitions). */
export function refreshScrollTrigger() {
  if (typeof window === "undefined") return;
  ScrollTrigger.refresh();
}
