"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { springs } from "@/lib/motion";

/**
 * ScrollReveal (Framer Motion) - subtle entrance animation on scroll.
 *
 * Drop-in replacement for the GSAP ScrollReveal with the same API surface.
 * Uses Framer Motion's `whileInView` for GPU-accelerated, interruptible
 * scroll-triggered animations.
 *
 * Content is always visible (opacity starts at 0.4, never 0) so if
 * JavaScript fails or reduced motion is preferred, nothing is hidden.
 */
export function ScrollReveal({
  children,
  className,
  y = 16,
  stagger: _stagger = 0,
  amount = 0.25,
}: {
  children: ReactNode;
  className?: string;
  /** translateY offset to animate from (px). Default 16. */
  y?: number;
  /** Stagger delay between items (seconds). Passed to children via parent context. */
  stagger?: number;
  /** Viewport fraction required to trigger (0-1). */
  amount?: number;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.4, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={springs.enter}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScrollRevealItem - marks a child to be individually animated within a
 * ScrollReveal container. When used standalone (without a parent ScrollReveal
 * that handles the animation), each item triggers its own whileInView.
 *
 * Accepts an optional `index` prop for stagger delay calculation.
 */
export function ScrollRevealItem({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Index for stagger delay calculation (defaults to 0). */
  index?: number;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.4, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...springs.enter, delay: index * 0.05 }}
    >
      {children}
    </motion.div>
  );
}
