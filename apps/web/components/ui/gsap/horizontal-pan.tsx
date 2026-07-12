"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * HorizontalPan — a full-viewport-width section that scrolls horizontally
 * as the user scrolls vertically (scroll-hijack). Use sparingly.
 *
 * Honors `prefers-reduced-motion`: degrades to a simple horizontal scroll.
 */
export function HorizontalPan({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !wrap.current || !track.current) return;

      const ctx = gsap.context(() => {
        const distance = track.current!.scrollWidth - window.innerWidth;
        if (distance <= 0) return;

        gsap.to(track.current, {
          x: -distance,
          ease: "none",
          scrollTrigger: {
            trigger: wrap.current,
            start: "top top",
            end: () => `+=${distance}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true
          }
        });
      }, wrap.current);

      return () => ctx.revert();
    },
    { scope: wrap }
  );

  return (
    <section ref={wrap} className={className ?? ""}>
      <div ref={track} className="flex h-[100dvh] items-center gap-6">
        {children}
      </div>
    </section>
  );
}
