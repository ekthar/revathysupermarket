/**
 * Spacing System — consistent with web app
 * Base unit: 4px
 */

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

// Layout constants
export const layout = {
  /** Minimum touch target size (44px) */
  touchTarget: 44,
  /** Page horizontal padding */
  pagePadding: 16,
  /** Card internal padding */
  cardPadding: 16,
  /** Section vertical gap */
  sectionGap: 24,
  /** Item gap in lists */
  itemGap: 12,
  /** Bottom tab bar height */
  tabBarHeight: 64,
  /** Header height */
  headerHeight: 56,
  /** Floating cart bar bottom offset */
  floatingBarBottom: 80,
} as const;
