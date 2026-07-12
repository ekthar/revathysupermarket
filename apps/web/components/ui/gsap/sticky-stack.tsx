"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * StickyStack — canonical GSAP pinned card stack.
 *
 * Cards stack on top of each other as the user scrolls.
 * The last card is never pinned so scrolling can continue past the section.
 *
 * Honors `prefers-reduced-motion`: turns into a simple vertical list.
 */
export function StickyStack({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const wrapper = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !wrapper.current) return;

      const ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>(".stack-card");
        if (cards.length < 2) return;

        cards.forEach((card, i) => {
          if (i === cards.length - 1) return;

          ScrollTrigger.create({
            trigger: card,
            start: "top top",
            endTrigger: cards[cards.length - 1],
            end: "top top",
            pin: true,
            pinSpacing: false
          });

          gsap.to(card, {
            scale: 0.92,
            opacity: 0.55,
            ease: "none",
            scrollTrigger: {
              trigger: cards[i + 1],
              start: "top bottom",
              end: "top top",
              scrub: true
            }
          });
        });
      }, wrapper.current);

      return () => ctx.revert();
    },
    { scope: wrapper }
  );

  return (
    <div ref={wrapper} className={className}>
      {children}
    </div>
  );
}

/**
 * StackCard — an item within a StickyStack.
 * Add `.stack-card` automatically via this wrapper.
 */
export function StackCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center ${className ?? ""}`}>
      {children}
    </div>
  );
}
