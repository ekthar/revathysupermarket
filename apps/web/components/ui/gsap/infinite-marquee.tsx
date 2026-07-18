"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * InfiniteMarquee — GSAP-powered horizontal ticker.
 *
 * Content scrolls infinitely. Pauses on hover. Respects reduced motion.
 * Uses duplicate content trick for seamless looping.
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

  useGSAP(
    () => {
      if (prefersReducedMotion() || !containerRef.current || !trackRef.current) return;

      const track = trackRef.current;
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
    },
    { scope: containerRef }
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

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className ?? ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      <div ref={trackRef} className="flex w-max whitespace-nowrap">
        {/* Duplicate content for seamless loop */}
        <div className="flex items-center gap-8 pr-8">{children}</div>
        <div className="flex items-center gap-8 pr-8">{children}</div>
      </div>
    </div>
  );
}
