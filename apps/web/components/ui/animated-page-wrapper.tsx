"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { springs } from "@/lib/motion";

interface AnimatedPageWrapperProps {
  children: ReactNode;
  className?: string;
  /** Delay before animation starts (seconds) */
  delay?: number;
}

/**
 * Consistent page enter animation wrapper.
 * Provides a slide-up + fade-in on enter with spring physics.
 * Use on customer-facing pages (dashboard, cart, account, etc.)
 */
export function AnimatedPageWrapper({
  children,
  className,
  delay = 0,
}: AnimatedPageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.enter, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered children container - each direct child animates in sequence.
 */
export function StaggeredContainer({
  children,
  className,
  staggerDelay = 0.06,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual staggered item - use inside StaggeredContainer.
 */
export function StaggeredItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: springs.enter,
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
