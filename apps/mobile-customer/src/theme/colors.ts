/**
 * Design System Colors — aligned with web app (black-dominant, green accent)
 * Source of truth: /apps/web/tailwind.config.ts + globals.css
 */
export const colors = {
  // Primary — near-black, used for CTAs, active states, bold text
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

  // Secondary — green accent for success, live indicators, subtle highlights
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

  // Neutral — for text, backgrounds, borders
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

  // Semantic colors
  success: {
    DEFAULT: "#22C55E",
    50: "#DCFCE7",
    100: "#DCFCE7",
    300: "#86EFAC",
    500: "#16A34A",
    700: "#166534",
  },
  error: {
    DEFAULT: "#EF4444",
    50: "#FEF2F2",
    100: "#FEE2E2",
    300: "#FCA5A5",
    500: "#EF4444",
    700: "#B91C1C",
  },
  warning: {
    DEFAULT: "#F59E0B",
    50: "#FFFBEB",
    100: "#FEF3C7",
    300: "#FCD34D",
    500: "#F59E0B",
    700: "#B45309",
  },
  info: {
    DEFAULT: "#3B82F6",
    50: "#EFF6FF",
    100: "#DBEAFE",
    300: "#93C5FD",
    500: "#3B82F6",
    700: "#1D4ED8",
  },

  // Background tokens
  background: {
    DEFAULT: "#FFFFFF",
    subtle: "#F9FAFB",
    muted: "#F3F4F6",
  },

  // Dark mode
  dark: {
    background: "#0A0F1A",
    card: "#111827",
    border: "#1F2937",
    muted: "#374151",
    mutedForeground: "#9CA3AF",
  },
} as const;

// Convenience aliases
export const palette = {
  black: "#050505",
  white: "#FFFFFF",
  green: "#22C55E",
  red: "#EF4444",
  amber: "#F59E0B",
  blue: "#3B82F6",
} as const;
