"use client";

import { motion } from "framer-motion";
import { springs } from "@/lib/motion";

// Page transition wrapper - wraps page content for enter/exit animations
export function PageTransition({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={springs.enter}
    >
      {children}
    </motion.div>
  );
}

// Slide from right - for drill-down navigation (cart → checkout)
export function SlideInPage({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={springs.layout}
    >
      {children}
    </motion.div>
  );
}

// Slide from bottom - for modals and overlays
export function SlideUpOverlay({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={springs.gentle}
    >
      {children}
    </motion.div>
  );
}
