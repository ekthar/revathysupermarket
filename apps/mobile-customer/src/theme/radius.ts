/**
 * Border Radius System — matches web tailwind config
 */

export const radius = {
  /** 6px — tiny elements, badges */
  sm: 6,
  /** 12px — standard cards, inputs */
  md: 12,
  /** 16px — medium cards */
  lg: 16,
  /** 20px — large cards, modals */
  xl: 20,
  /** 28px — hero sections */
  "2xl": 28,
  /** 9999 — pills, avatars, buttons */
  full: 9999,
  /** iOS squircle card radius */
  squircle: 26,
} as const;
