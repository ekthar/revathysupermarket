"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * ScrollReveal — fade/slide children into view once, GSAP-powered.
 *
 * Safety: content starts visible (CSS default). GSAP hides it then reveals.
 * If GSAP fails, a 3s timeout forces visibility. Content is NEVER permanently hidden.
 *
 * Apple HIG: reveals should be subtle and purposeful.
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
  const animatedRef = useRef(false);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (prefersReducedMotion()) {
        gsap.set(el, { opacity: 1, y: 0 });
        const items = el.querySelectorAll("[data-reveal-item]");
        if (items.length) gsap.set(items, { opacity: 1, y: 0 });
        animatedRef.current = true;
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
          },
          onComplete: () => {
            animatedRef.current = true;
          }
        });
      }, el);

      return () => ctx.revert();
    },
    { scope: ref, dependencies: [y, delay, stagger, duration, once, amount] }
  );

  // Safety: force visible after 3s if GSAP hasn't completed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!animatedRef.current && ref.current) {
        ref.current.style.opacity = "1";
        ref.current.style.transform = "none";
        ref.current.querySelectorAll("[data-reveal-item]").forEach((el) => {
          (el as HTMLElement).style.opacity = "1";
          (el as HTMLElement).style.transform = "none";
        });
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
