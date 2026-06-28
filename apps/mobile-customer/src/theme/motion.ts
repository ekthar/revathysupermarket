/**
 * Motion / Animation presets — aligned with web framer-motion springs
 * For use with react-native-reanimated
 */

import { WithSpringConfig, WithTimingConfig, Easing } from "react-native-reanimated";

/** Spring presets matching web framer-motion configs */
export const spring = {
  /** Default spring for most transitions */
  default: {
    damping: 25,
    stiffness: 300,
    mass: 1,
  } satisfies WithSpringConfig,

  /** Snappy spring for quick interactions */
  snappy: {
    damping: 30,
    stiffness: 400,
    mass: 1,
  } satisfies WithSpringConfig,

  /** Bouncy spring for playful animations */
  bouncy: {
    damping: 15,
    stiffness: 300,
    mass: 1,
  } satisfies WithSpringConfig,

  /** Gentle spring for subtle movements */
  gentle: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  } satisfies WithSpringConfig,
} as const;

/** Timing presets */
export const timing = {
  fast: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  standard: {
    duration: 240,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  slow: {
    duration: 400,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  } satisfies WithTimingConfig,
} as const;

/** Tap scale values for press feedback */
export const tapScale = {
  /** Standard button/card press */
  primary: 0.97,
  /** Smaller element press */
  secondary: 0.95,
  /** Large area press */
  subtle: 0.98,
} as const;

/** Stagger delay for list items (in ms) */
export const staggerDelay = 50;

/** Entrance animation delays */
export const entranceDelay = {
  first: 0,
  second: 100,
  third: 200,
  fourth: 300,
} as const;
