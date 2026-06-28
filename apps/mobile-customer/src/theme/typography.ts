/**
 * Typography System — aligned with web app
 * Source of truth: /apps/web/tailwind.config.ts fontSize definitions
 *
 * Web uses:
 *  - Display: Manrope (font-display) — for headings
 *  - Body: Inter (font-sans) — for body text
 *
 * Mobile uses system fonts but with matching sizes/weights/spacing.
 * Custom fonts (Manrope, Inter) can be loaded via expo-font later.
 */

import { Platform } from "react-native";

// Font families — using system until custom fonts are loaded
export const fontFamily = {
  // Display font — bold headings
  display: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: "System",
  }),
  // Body font — general text
  sans: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: "System",
  }),
  // Monospace — for OTP, codes
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
} as const;

// Font weights mapped to React Native numeric values
export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
  black: "900" as const,
} as const;

// Type scale — matches web tailwind config
export const typeScale = {
  display: {
    fontSize: 32,
    lineHeight: 35,
    letterSpacing: -0.64, // -0.02em
    fontWeight: fontWeight.black,
  },
  heading: {
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.48, // -0.02em
    fontWeight: fontWeight.bold,
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.3, // -0.015em
    fontWeight: fontWeight.bold,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0,
    fontWeight: fontWeight.medium,
  },
  micro: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0,
    fontWeight: fontWeight.medium,
  },
} as const;

// Section title — special case for section headers (like web .section-title)
export const sectionTitle = {
  fontSize: 24,
  lineHeight: 29,
  letterSpacing: -0.72, // -0.03em
  fontWeight: fontWeight.black,
} as const;
