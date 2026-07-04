/**
 * Shared fallbacks for categories that don't have a custom emoji/photo/color set
 * in the admin panel yet. Keeping these in one place means the homepage widget,
 * and anything else that renders category tiles, stays visually consistent.
 */

// Generic shopping-cart emoji shown when a category has no custom icon.
export const CATEGORY_ICON_FALLBACK = "🛒";

// Generic product photo shown when a category has no custom image.
export const CATEGORY_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop";

// Rotating background tint for the desktop category cards, cycled by sort position
// since color isn't (yet) an admin-editable field.
export const CATEGORY_COLOR_PALETTE = [
  "bg-orange-50",
  "bg-secondary-50",
  "bg-blue-50",
  "bg-yellow-50",
  "bg-pink-50",
  "bg-purple-50",
  "bg-rose-50",
  "bg-cyan-50",
  "bg-amber-50"
];

export function categoryColorForIndex(index: number): string {
  return CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length];
}
