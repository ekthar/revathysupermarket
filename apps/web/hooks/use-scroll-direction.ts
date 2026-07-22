"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollDirection = "up" | "down" | "idle";

interface UseScrollDirectionOptions {
  /** Minimum scroll distance before triggering direction change (prevents jitter) */
  threshold?: number;
  /** Only track after scrolling past this Y offset (keeps header visible at top) */
  startOffset?: number;
}

/**
 * useScrollDirection — tracks scroll direction with hysteresis.
 *
 * Used for collapsing headers (iOS-style hide-on-scroll-down, show-on-scroll-up).
 * Uses a threshold to prevent jitter from small finger movements.
 *
 * Returns:
 * - direction: "up" | "down" | "idle"
 * - scrollY: current scroll position
 * - isAtTop: whether scroll is near the top (within startOffset)
 */
export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, startOffset = 60 } = options;
  const [direction, setDirection] = useState<ScrollDirection>("idle");
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const lastDirection = useRef<ScrollDirection>("idle");
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        setIsAtTop(currentY <= startOffset);

        // Only change direction if past the start offset and delta exceeds threshold
        if (currentY > startOffset) {
          if (delta > threshold && lastDirection.current !== "down") {
            lastDirection.current = "down";
            setDirection("down");
          } else if (delta < -threshold && lastDirection.current !== "up") {
            lastDirection.current = "up";
            setDirection("up");
          }
        } else {
          // Near the top — always show header
          if (lastDirection.current !== "idle") {
            lastDirection.current = "idle";
            setDirection("idle");
          }
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, startOffset]);

  return { direction, isAtTop, scrollY: lastScrollY.current };
}
