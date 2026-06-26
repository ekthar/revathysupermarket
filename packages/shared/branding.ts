/**
 * Unified Branding Configuration
 * ================================
 * Single source of truth for all brand-related constants.
 * Change these values to update branding across all apps.
 */

export const BRAND = {
  /** Store/app name */
  name: "MSM Supermarket",

  /** Short name for PWA, notifications */
  shortName: "MSM",

  /** Tagline */
  tagline: "Fresh groceries, delivered fast",

  /** Brand colors */
  colors: {
    /** Primary brand color (used for theme, splash backgrounds) */
    primary: "#059669",

    /** Primary foreground (text on primary) */
    primaryForeground: "#FFFFFF",

    /** Dark background */
    dark: "#050505",

    /** Light background */
    light: "#FFFFFF",

    /** Neutral background */
    neutral: "#F7F7FA",
  },

  /** Logo paths (relative to public directory for web, assets for mobile) */
  logos: {
    /** SVG logo for light mode (dark logo on light bg) */
    lightModeSvg: "/branding/logo-light.svg",

    /** SVG logo for dark mode (light logo on dark bg) */
    darkModeSvg: "/branding/logo-dark.svg",

    /** Square icon SVG (app icons, favicons) */
    iconSvg: "/branding/logo-icon.svg",
  },

  /** PWA configuration */
  pwa: {
    themeColor: "#050505",
    backgroundColor: "#F7F7FA",
  },

  /** Mobile splash screen */
  splash: {
    backgroundColor: "#059669",
  },
} as const;

export type Brand = typeof BRAND;
