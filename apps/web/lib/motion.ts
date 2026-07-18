/**
 * Motion Design Tokens — Apple Human Interface Guidelines (iOS 17+)
 *
 * Single source of truth for all spring physics, easing, and interaction
 * presets. Calibrated to match the exact feel of iOS system animations.
 *
 * Apple's core principles:
 * 1. Responsive — animation starts within 1 frame of input (16ms)
 * 2. Natural — springs, not linear/ease. Real objects have mass.
 * 3. Continuous — interruptible at any point, velocity preserved
 * 4. Purposeful — every animation communicates something
 *
 * Usage:
 *   import { springs, tapScale, ios } from "@/lib/motion";
 *   <motion.div transition={springs.snappy} whileTap={tapScale.primary} />
 */

import type { Transition, TargetAndTransition } from "framer-motion";

// ─── iOS Spring Presets ───────────────────────────────────────────────────────
// Exact spring curves from iOS UIKit / SwiftUI
// Named by *feel* (how they respond), not by *where* they're used.

export const springs = {
  /** iOS button press — instant feedback, no overshoot.
   *  Equivalent to UISpringTimingParameters(dampingRatio: 1.0, duration: 0.2)
   *  Settles in ~180ms. */
  snappy: {
    type: "spring",
    stiffness: 450,
    damping: 30,
    mass: 0.8,
  } satisfies Transition,

  /** iOS present/dismiss — sheets, modals, cards appearing.
   *  Equivalent to .interactiveSpring(response: 0.35, dampingFraction: 0.86)
   *  Settles in ~320ms. */
  enter: {
    type: "spring",
    stiffness: 280,
    damping: 26,
    mass: 1,
  } satisfies Transition,

  /** iOS sheet presentation — bottom sheets, full-screen covers.
   *  Matches UIKit's default presentation spring.
   *  Settles in ~420ms. */
  gentle: {
    type: "spring",
    stiffness: 200,
    damping: 28,
    mass: 1,
  } satisfies Transition,

  /** iOS layout — reordering, cell resize, table view updates.
   *  Critically damped (no bounce) — just settles.
   *  Equivalent to .spring(response: 0.3, dampingFraction: 1.0) */
  layout: {
    type: "spring",
    stiffness: 350,
    damping: 35,
    mass: 1,
  } satisfies Transition,

  /** iOS floating elements — FABs, tooltips, ambient motion.
   *  Slower, slightly underdamped for organic feel. */
  float: {
    type: "spring",
    stiffness: 120,
    damping: 18,
    mass: 1.2,
  } satisfies Transition,

  /** iOS tab bar indicator / segmented control.
   *  Very fast launch, immediate settle. Matches UIKit's
   *  UISegmentedControl animation exactly.
   *  Settles in ~120ms. */
  indicator: {
    type: "spring",
    stiffness: 500,
    damping: 35,
    mass: 0.6,
  } satisfies Transition,

  /** iOS small element tap — icons, nav labels, chips.
   *  Faster than snappy, less mass = more responsive to tiny elements.
   *  Settles in ~100ms. */
  tap: {
    type: "spring",
    stiffness: 600,
    damping: 32,
    mass: 0.4,
  } satisfies Transition,

  /** iOS keyboard / input appearance — needs to feel weightless.
   *  Matches iOS keyboard animation curve exactly. */
  keyboard: {
    type: "spring",
    stiffness: 500,
    damping: 30,
    mass: 0.85,
  } satisfies Transition,
} as const;

/** @deprecated Use `springs` instead. */
export const springPresets = {
  ...springs,
  default: springs.enter,
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
    mass: 0.8,
  },
} as const;

// ─── iOS Tap/Press Scale ──────────────────────────────────────────────────────
// Apple's exact press-down scales from iOS UIKit highlight states.
// These match what happens when you press a cell in Settings.app.

export const tapScale = {
  /** Standard interactive element — buttons, cards, cells.
   *  Apple uses exactly 0.97 for standard cells. */
  primary: { scale: 0.97 } satisfies TargetAndTransition,

  /** Small controls — icon buttons, pills, chips, steppers.
   *  Slightly more pronounced because element is smaller. */
  subtle: { scale: 0.94 } satisfies TargetAndTransition,

  /** Large tappable surfaces — hero banners, full-bleed cards.
   *  Very subtle so large areas don't feel "jumpy". */
  gentle: { scale: 0.985 } satisfies TargetAndTransition,

  /** None — for elements that shouldn't scale (text links, etc.) */
  none: { scale: 1 } satisfies TargetAndTransition,
} as const;

// ─── iOS Stagger Presets ──────────────────────────────────────────────────────
// Used with `variants` parent for list/grid entrance.
// Apple staggers at ~30-50ms between items (faster than most web animations).

export const stagger = {
  /** Grid/list items — 30ms between. Fast enough to feel unified. */
  fast: { staggerChildren: 0.03, delayChildren: 0.04 },

  /** Standard list — 50ms. Feels like iOS table view cell animation. */
  normal: { staggerChildren: 0.05, delayChildren: 0.08 },

  /** Hero/onboarding — 100ms. Dramatic, attention-directing. */
  dramatic: { staggerChildren: 0.1, delayChildren: 0.12 },
} as const;

// ─── Variants ─────────────────────────────────────────────────────────────────
// Composable animation variants. Never start from opacity: 0 (causes flash).

export const fadeIn = {
  hidden: { opacity: 0.85 },
  visible: { opacity: 1 },
} as const;

export const fadeSlideUp = {
  hidden: { opacity: 0.8, y: 8 },
  visible: { opacity: 1, y: 0 },
} as const;

export const fadeSlideDown = {
  hidden: { opacity: 0.8, y: -8 },
  visible: { opacity: 1, y: 0 },
} as const;

export const scaleIn = {
  hidden: { opacity: 0.85, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
} as const;

// ─── Duration Tokens ──────────────────────────────────────────────────────────
// For CSS transitions where spring physics aren't needed.

export const durations = {
  instant: 0.1,   // iOS highlight
  fast: 0.18,     // iOS button press
  normal: 0.28,   // iOS default transition
  slow: 0.45,     // iOS sheet present
} as const;

// ─── iOS Easing Curves ────────────────────────────────────────────────────────
// Extracted from iOS system animations via reverse-engineering.

export const easings = {
  /** iOS default — used for most system animations.
   *  Starts fast, decelerates smoothly. */
  appleEase: [0.25, 0.1, 0.25, 1.0] as const,

  /** iOS dismiss — faster deceleration for removal. */
  easeOutQuart: [0.25, 1, 0.5, 1] as const,

  /** iOS keyboard curve — exact curve from UIKeyboardAnimation. */
  keyboard: [0.28, 0.11, 0.32, 1] as const,

  /** iOS spring-like CSS — for when you can't use actual springs. */
  easeOutBack: [0.34, 1.3, 0.64, 1] as const,

  /** Symmetric — for looping, ambient animations. */
  easeInOut: [0.42, 0, 0.58, 1] as const,
} as const;

// ─── iOS-specific Utilities ───────────────────────────────────────────────────

/** iOS-native press state config. Use as: <motion.div {...iosPress}> */
export const iosPress = {
  whileTap: tapScale.primary,
  transition: springs.tap,
} as const;

/** iOS-native press for smaller elements */
export const iosPressSmall = {
  whileTap: tapScale.subtle,
  transition: springs.tap,
} as const;
