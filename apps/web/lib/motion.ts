/**
 * Shared motion design tokens — a single source of truth for spring physics
 * and transition presets used across the app. Inspired by Apple's Human
 * Interface Guidelines: animations should feel responsive (quick to start),
 * natural (springy, not linear), and consistent across similar interactions.
 *
 * Usage:
 *   import { springs, transitions, tapScale } from "@/lib/motion";
 *   <motion.div transition={springs.snappy} whileTap={tapScale.primary} />
 */

import type { Transition, TargetAndTransition } from "framer-motion";

// ─── Spring Presets ───────────────────────────────────────────────────────────
// Named by *feel*, not by where they're used — so the same feel is always the
// same physics regardless of context.

export const springs = {
  /** Quick tactile feedback — button presses, stepper taps, toggle flips.
   *  Feels snappy and responsive, settles in ~200ms. */
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 28,
    mass: 0.8,
  } satisfies Transition,

  /** Standard entrance — cards/sections sliding in, modals appearing.
   *  Slightly softer than snappy; settles in ~350ms. */
  enter: {
    type: "spring",
    stiffness: 260,
    damping: 24,
    mass: 1,
  } satisfies Transition,

  /** Overlays, sheets, and full-screen transitions — larger elements that
   *  need a gentler, more deliberate entrance. Settles in ~450ms. */
  gentle: {
    type: "spring",
    stiffness: 200,
    damping: 26,
    mass: 1,
  } satisfies Transition,

  /** Layout shifts — reordering lists, resizing containers. Very critically
   *  damped so it doesn't oscillate, just eases into place. */
  layout: {
    type: "spring",
    stiffness: 300,
    damping: 32,
    mass: 1,
  } satisfies Transition,

  /** Subtle/ambient — floating elements, pulse emphasis. Slower, dreamier. */
  float: {
    type: "spring",
    stiffness: 120,
    damping: 18,
    mass: 1.2,
  } satisfies Transition,
} as const;

/** @deprecated Use `springs` instead. Backwards-compatible alias. */
export const springPresets = {
  ...springs,
  /** @deprecated Use springs.enter */
  default: springs.enter,
  /** @deprecated Use springs.snappy with lower damping if you need bounce */
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
    mass: 0.8,
  },
} as const;

// ─── Tap/Press Scale Presets ──────────────────────────────────────────────────
// Used with `whileTap` on interactive elements for that Apple "press" feel.

export const tapScale = {
  /** Primary interactive elements — buttons, cards, nav items */
  primary: { scale: 0.97 } satisfies TargetAndTransition,

  /** Smaller controls — icon buttons, chips, toggles */
  subtle: { scale: 0.95 } satisfies TargetAndTransition,

  /** Large tappable areas — hero banners, full-width cards */
  gentle: { scale: 0.985 } satisfies TargetAndTransition,
} as const;

// ─── Stagger Presets ──────────────────────────────────────────────────────────
// Used with `variants` for list/grid entrance animations.

export const stagger = {
  /** Fast stagger for grids — 40ms between items */
  fast: { staggerChildren: 0.04, delayChildren: 0.06 },

  /** Standard stagger for lists — 60ms between items */
  normal: { staggerChildren: 0.06, delayChildren: 0.1 },

  /** Slow stagger for hero sequences — 120ms between items */
  dramatic: { staggerChildren: 0.12, delayChildren: 0.15 },
} as const;

// ─── Fade/Slide Variants ──────────────────────────────────────────────────────
// Common animation variants that can be composed with spring presets.

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;

export const fadeSlideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
} as const;

export const fadeSlideDown = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0 },
} as const;

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
} as const;

// ─── Duration Tokens ──────────────────────────────────────────────────────────
// For CSS transitions where spring physics aren't appropriate.

export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
} as const;

// ─── Easing Curves ────────────────────────────────────────────────────────────
// CSS-compatible cubic bezier curves for non-spring transitions.

export const easings = {
  /** Apple's default ease — quick out, gentle settle */
  appleEase: [0.25, 0.1, 0.25, 1.0] as const,
  /** Ease out quart — fast deceleration */
  easeOutQuart: [0.25, 1, 0.5, 1] as const,
  /** Ease in out — symmetric, for looping/ambient */
  easeInOut: [0.42, 0, 0.58, 1] as const,
} as const;
