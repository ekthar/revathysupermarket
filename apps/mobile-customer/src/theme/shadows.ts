/**
 * Shadow / Elevation System — matches web CSS shadows
 * React Native uses elevation (Android) and shadow* props (iOS)
 */

import { Platform, ViewStyle } from "react-native";

type ShadowStyle = Pick<
  ViewStyle,
  | "shadowColor"
  | "shadowOffset"
  | "shadowOpacity"
  | "shadowRadius"
  | "elevation"
>;

/** Subtle cards, list items */
export const elevation1: ShadowStyle = Platform.select({
  ios: {
    shadowColor: "#050505",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: {
    elevation: 2,
  },
  default: {},
}) as ShadowStyle;

/** Standard cards */
export const elevation2: ShadowStyle = Platform.select({
  ios: {
    shadowColor: "#050505",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  android: {
    elevation: 4,
  },
  default: {},
}) as ShadowStyle;

/** Prominent elements, modals */
export const elevation3: ShadowStyle = Platform.select({
  ios: {
    shadowColor: "#050505",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  android: {
    elevation: 8,
  },
  default: {},
}) as ShadowStyle;

/** Premium/hero cards */
export const elevationPremium: ShadowStyle = Platform.select({
  ios: {
    shadowColor: "#050505",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
  },
  android: {
    elevation: 12,
  },
  default: {},
}) as ShadowStyle;

/** Soft floating elements */
export const elevationSoft: ShadowStyle = Platform.select({
  ios: {
    shadowColor: "#050505",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  android: {
    elevation: 6,
  },
  default: {},
}) as ShadowStyle;

export const shadows = {
  elevation1,
  elevation2,
  elevation3,
  elevationPremium,
  elevationSoft,
} as const;
