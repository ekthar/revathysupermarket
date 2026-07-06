import { WithSpringConfig, WithTimingConfig, Easing } from "react-native-reanimated";

export const spring = {
  default: { damping: 25, stiffness: 300, mass: 1 } satisfies WithSpringConfig,
  snappy: { damping: 30, stiffness: 400, mass: 1 } satisfies WithSpringConfig,
  bouncy: { damping: 15, stiffness: 300, mass: 1 } satisfies WithSpringConfig,
  gentle: { damping: 20, stiffness: 200, mass: 1 } satisfies WithSpringConfig,
} as const;

export const timing = {
  fast: { duration: 150, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } satisfies WithTimingConfig,
  standard: { duration: 240, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } satisfies WithTimingConfig,
  slow: { duration: 400, easing: Easing.bezier(0.16, 1, 0.3, 1) } satisfies WithTimingConfig,
} as const;

export const tapScale = {
  primary: 0.97,
  secondary: 0.95,
  subtle: 0.98,
} as const;

export const staggerDelay = 50;

export const entranceDelay = {
  first: 0,
  second: 100,
  third: 200,
  fourth: 300,
} as const;
