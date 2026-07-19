/**
 * Motion / Animation presets — aligned with web (Framer Motion) & shared design tokens
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * Source of truth: /packages/shared/design-tokens.ts (motion section)
 * Web equivalent: /apps/web/lib/motion.ts
 *
 * For use with react-native-reanimated. All spring configs match
 * the exact feel of their web counterparts.
 */

import { WithSpringConfig, WithTimingConfig, Easing } from "react-native-reanimated";

// ─── Spring Presets (iOS System Animation feel) ───────────────────────────────

export const spring = {
  /** iOS button press — instant, no overshoot. ~180ms settle. */
  snappy: {
    damping: 30,
    stiffness: 450,
    mass: 0.8,
  } satisfies WithSpringConfig,

  /** iOS present/dismiss — sheets, modals. ~320ms settle. */
  enter: {
    damping: 26,
    stiffness: 280,
    mass: 1,
  } satisfies WithSpringConfig,

  /** iOS sheet presentation. ~420ms settle. */
  gentle: {
    damping: 28,
    stiffness: 200,
    mass: 1,
  } satisfies WithSpringConfig,

  /** iOS layout — reordering, resize. Critically damped (no bounce). */
  layout: {
    damping: 35,
    stiffness: 350,
    mass: 1,
  } satisfies WithSpringConfig,

  /** iOS floating elements — FABs, tooltips. Organic feel. */
  float: {
    damping: 18,
    stiffness: 120,
    mass: 1.2,
  } satisfies WithSpringConfig,

  /** iOS tab/segment indicator. Very fast. ~120ms settle. */
  indicator: {
    damping: 35,
    stiffness: 500,
    mass: 0.6,
  } satisfies WithSpringConfig,

  /** iOS small tap — icons, chips. ~100ms settle. */
  tap: {
    damping: 32,
    stiffness: 600,
    mass: 0.4,
  } satisfies WithSpringConfig,

  /** Bouncy — playful animations with more overshoot. */
  bouncy: {
    damping: 15,
    stiffness: 300,
    mass: 1,
  } satisfies WithSpringConfig,

  /** Default — standard for most transitions. */
  default: {
    damping: 25,
    stiffness: 300,
    mass: 1,
  } satisfies WithSpringConfig,
} as const;

// ─── Timing Presets ───────────────────────────────────────────────────────────

export const timing = {
  instant: {
    duration: 100,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  fast: {
    duration: 180,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  standard: {
    duration: 280,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  slow: {
    duration: 450,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  } satisfies WithTimingConfig,

  /** iOS keyboard curve */
  keyboard: {
    duration: 280,
    easing: Easing.bezier(0.28, 0.11, 0.32, 1),
  } satisfies WithTimingConfig,
} as const;

// ─── Tap Scale ────────────────────────────────────────────────────────────────

/** Apple's exact press-down scales from iOS UIKit */
export const tapScale = {
  /** Standard button/card press (Apple uses exactly 0.97) */
  primary: 0.97,
  /** Small controls — icon buttons, pills, chips */
  subtle: 0.94,
  /** Large tappable surfaces — hero banners, full-bleed cards */
  gentle: 0.985,
} as const;

// ─── Stagger & Entrance Delays ────────────────────────────────────────────────

/** Stagger delay between list items (ms) */
export const stagger = {
  /** Grid items — fast, feels unified */
  fast: 30,
  /** Standard list — iOS table view feel */
  normal: 50,
  /** Hero/onboarding — dramatic, attention-directing */
  dramatic: 100,
} as const;

/** @deprecated Use stagger instead */
export const staggerDelay = stagger.normal;

/** Entrance animation delays (ms) */
export const entranceDelay = {
  first: 0,
  second: 100,
  third: 200,
  fourth: 300,
  fifth: 400,
} as const;

// ─── Easing Curves ────────────────────────────────────────────────────────────

export const easings = {
  /** iOS default — starts fast, decelerates smoothly */
  appleEase: Easing.bezier(0.25, 0.1, 0.25, 1),
  /** iOS dismiss — faster deceleration for removal */
  easeOutQuart: Easing.bezier(0.25, 1, 0.5, 1),
  /** iOS spring-like for timing-based */
  easeOutBack: Easing.bezier(0.34, 1.3, 0.64, 1),
  /** Symmetric — for looping, ambient animations */
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
} as const;
