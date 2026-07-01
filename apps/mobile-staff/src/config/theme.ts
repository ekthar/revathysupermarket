/**
 * Central theme constants for the staff app.
 *
 * The Tailwind `primary` palette is emerald (see tailwind.config.js). To avoid
 * arbitrarily mixing emerald shades (#059669 vs #10b981) across the codebase,
 * these tokens define the single source of truth for hardcoded accent hexes
 * used in imperative styles (tab bars, gesture components, loaders, etc.).
 */

export const colors = {
  /** primary-500 — the canonical accent used for active/interactive states */
  primary: "#10b981",
  /** primary-600 — pressed/darker accent */
  primaryDark: "#059669",
  /** primary-400 — lighter accent for gradients/highlights */
  primaryLight: "#34d399",

  /** slate-400 — inactive/muted foreground */
  muted: "#94a3b8",

  white: "#ffffff",
} as const;

/** Canonical accent used for active tab tint across all role tab bars. */
export const ACTIVE_TINT = colors.primary;
export const INACTIVE_TINT = colors.muted;
