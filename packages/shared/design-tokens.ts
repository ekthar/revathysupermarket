/**
 * Unified Design Tokens — Shared between Web & Mobile
 * ════════════════════════════════════════════════════
 *
 * Single source of truth for design decisions that should be
 * consistent across platforms. Platform-specific implementations
 * (CSS vars for web, StyleSheet for mobile) reference these values.
 *
 * Architecture:
 * - This file: defines the values
 * - Web: /apps/web/tailwind.config.ts uses these + globals.css
 * - Mobile: /apps/mobile-customer/src/theme/* mirrors these
 */

// ─── Color System ─────────────────────────────────────────────────────────────

export const colors = {
  /** Primary — near-black, used for CTAs, active states, bold text */
  primary: {
    DEFAULT: "#050505",
    foreground: "#FFFFFF",
    50: "#F7F7F6",
    100: "#EDEDEC",
    200: "#D4D4D2",
    300: "#B0B0AD",
    400: "#8A8A86",
    500: "#6B6B67",
    600: "#525250",
    700: "#3D3D3B",
    800: "#272726",
    900: "#050505",
  },

  /** Secondary — green accent for success, live indicators */
  secondary: {
    DEFAULT: "#22C55E",
    foreground: "#FFFFFF",
    50: "#EDFCF2",
    100: "#D3F9E0",
    200: "#AAF0C4",
    300: "#73E3A2",
    400: "#3BCD7A",
    500: "#22C55E",
    600: "#12A347",
    700: "#0F823A",
    800: "#106630",
    900: "#0E5429",
  },

  /** Neutral — for text, backgrounds, borders */
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
    950: "#030712",
  },

  /** Semantic */
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",

  /** Backgrounds */
  background: {
    light: "#FFFFFF",
    dark: "#0A0F1A",
    subtle: "#F9FAFB",
  },
} as const;

// ─── Typography Scale ─────────────────────────────────────────────────────────

export const typography = {
  /** Font families — both platforms use Manrope (display) + Inter Tight (body) */
  fonts: {
    display: "Manrope",
    body: "Inter Tight",
    mono: "JetBrains Mono",
  },

  /** Type scale — px values, consistent across platforms */
  scale: {
    display: { size: 32, lineHeight: 35, letterSpacing: -0.64, weight: 900 },
    heading: { size: 24, lineHeight: 29, letterSpacing: -0.48, weight: 700 },
    title: { size: 20, lineHeight: 25, letterSpacing: -0.3, weight: 700 },
    body: { size: 14, lineHeight: 21, letterSpacing: 0, weight: 500 },
    caption: { size: 12, lineHeight: 17, letterSpacing: 0, weight: 500 },
    micro: { size: 10, lineHeight: 13, letterSpacing: 0, weight: 500 },
  },
} as const;

// ─── Motion System ────────────────────────────────────────────────────────────

/**
 * Spring physics — calibrated to iOS system animations.
 * Web uses these via Framer Motion. Mobile via Reanimated.
 *
 * Naming: by *feel*, not by *where*.
 */
export const motion = {
  springs: {
    /** iOS button press — instant, no overshoot. ~180ms settle. */
    snappy: { stiffness: 450, damping: 30, mass: 0.8 },

    /** iOS present/dismiss — sheets, modals. ~320ms settle. */
    enter: { stiffness: 280, damping: 26, mass: 1 },

    /** iOS sheet presentation. ~420ms settle. */
    gentle: { stiffness: 200, damping: 28, mass: 1 },

    /** iOS layout — reordering, resize. Critically damped. */
    layout: { stiffness: 350, damping: 35, mass: 1 },

    /** iOS floating elements — FABs, tooltips. */
    float: { stiffness: 120, damping: 18, mass: 1.2 },

    /** iOS tab/segment control indicator. ~120ms settle. */
    indicator: { stiffness: 500, damping: 35, mass: 0.6 },

    /** iOS small element tap. ~100ms settle. */
    tap: { stiffness: 600, damping: 32, mass: 0.4 },

    /** Bouncy — playful, more overshoot. */
    bouncy: { stiffness: 300, damping: 15, mass: 1 },
  },

  /** Tap scale values — Apple's exact press-down behavior */
  tapScale: {
    primary: 0.97,
    subtle: 0.94,
    gentle: 0.985,
  },

  /** Duration tokens — for timing-based animations */
  durations: {
    instant: 100,
    fast: 180,
    normal: 280,
    slow: 450,
  },

  /** Stagger delays (ms between items) */
  stagger: {
    fast: 30,
    normal: 50,
    dramatic: 100,
  },

  /** Easing curves (cubic-bezier) */
  easings: {
    appleEase: [0.25, 0.1, 0.25, 1.0],
    easeOutQuart: [0.25, 1, 0.5, 1],
    easeOutBack: [0.34, 1.3, 0.64, 1],
    easeInOut: [0.42, 0, 0.58, 1],
  },
} as const;

// ─── Spacing System ───────────────────────────────────────────────────────────

export const spacing = {
  /** Base unit: 4px */
  base: 4,

  /** Touch targets */
  touchTarget: 44,
  touchTargetLarge: 48,

  /** Layout constants */
  pagePadding: 16,
  sectionGap: 24,
  cardPadding: 16,
  headerHeight: 56,
  desktopHeaderHeight: 70,
  tabBarHeight: 64,
  mobileNavHeight: 82,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const;

// ─── Elevation / Shadows ──────────────────────────────────────────────────────

export const elevation = {
  /** Subtle card shadow */
  1: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  /** Standard card */
  2: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  /** Floating elements */
  3: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  /** Modals, sheets */
  4: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 12,
  },
} as const;

// ─── Dark Mode Mappings ───────────────────────────────────────────────────────

export const darkMode = {
  /** Background layers */
  background: {
    primary: "#0A0A0A",
    secondary: "#1C1C1E",
    tertiary: "#2C2C2E",
    elevated: "#111827",
  },

  /** Border colors */
  border: {
    subtle: "rgba(255, 255, 255, 0.04)",
    default: "rgba(255, 255, 255, 0.08)",
    strong: "rgba(255, 255, 255, 0.15)",
  },

  /** Text opacity */
  text: {
    primary: "rgba(255, 255, 255, 0.95)",
    secondary: "rgba(255, 255, 255, 0.7)",
    tertiary: "rgba(255, 255, 255, 0.5)",
    quaternary: "rgba(255, 255, 255, 0.3)",
  },

  /** Card backgrounds */
  card: {
    default: "#111827",
    hover: "#1F2937",
    active: "#374151",
  },
} as const;

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type Colors = typeof colors;
export type Typography = typeof typography;
export type Motion = typeof motion;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Elevation = typeof elevation;
export type DarkMode = typeof darkMode;
