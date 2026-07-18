"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * InfiniteMarquee — GSAP-powered horizontal ticker.
 *
 * On desktop: smooth scrolling ticker (pauses on hover).
 * On mobile: shows a single static line to save battery and reduce motion.
 * Respects prefers-reduced-motion globally.
 *
 * Apple HIG: motion should be purposeful, not decorative.
 * On mobile, information > animation. Users need to read, not watch.
 */
export function InfiniteMarquee({
  children,
  speed = 40,
  pauseOnHover = true,
  className,
  direction = "left",
}: {
  children: React.ReactNode;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
  direction?: "left" | "right";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useGSAP(
    () => {
      if (isMobile) return; // Static on mobile
      if (prefersReducedMotion() || !containerRef.current || !trackRef.current) return;

      const track = trackRef.current;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const contentWidth = track.scrollWidth / 2;
          if (contentWidth <= 0) return;

          const duration = contentWidth / speed;
          const xStart = direction === "left" ? 0 : -contentWidth;
          const xEnd = direction === "left" ? -contentWidth : 0;

          gsap.set(track, { x: xStart });

          tweenRef.current = gsap.to(track, {
            x: xEnd,
            duration,
            ease: "none",
            repeat: -1,
          });
        });
      });
    },
    { scope: containerRef, dependencies: [isMobile] }
  );

  const handleMouseEnter = () => {
    if (pauseOnHover && tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 0, duration: 0.5, ease: "power2.out" });
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 1, duration: 0.5, ease: "power2.in" });
    }
  };

  // Mobile: single static line (no animation, no GSAP, battery-friendly)
  if (isMobile) {
    return (
      <div className={`overflow-hidden ${className ?? ""}`} aria-hidden="true">
        <div className="flex items-center justify-center gap-3 px-4 text-center">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className ?? ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      <div ref={trackRef} className="flex w-max whitespace-nowrap">
        <div className="flex items-center gap-8 pr-8">{children}</div>
        <div className="flex items-center gap-8 pr-8">{children}</div>
      </div>
    </div>
  );
}
