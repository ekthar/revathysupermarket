/**
 * Blur Placeholder Generation — instant perceived image loading.
 *
 * Generates tiny base64 SVG data URLs that serve as blur placeholders
 * for product images. These render instantly (no network request) and
 * create the perception of content-aware loading.
 *
 * Strategies (in order of quality):
 * 1. Pre-computed blurDataURL (from image upload pipeline — future)
 * 2. Category-based color swatch (deterministic, zero cost)
 * 3. Generic neutral placeholder (fallback)
 *
 * The resulting data URL is a 4x4 SVG with a single fill color that,
 * when combined with CSS blur(20px) + scale(1.1), creates a smooth
 * color-wash placeholder matching the "dominant color" approach used
 * by Instagram, Pinterest, and Apple Photos.
 */

// ─── Category → Dominant Color Mapping ────────────────────────────────────────
// These are carefully chosen to match the visual average of typical product
// images in each category (warm for food, cool for household, etc.)

const CATEGORY_COLORS: Record<string, string> = {
  "Fruits": "#f4e6c8",        // Warm golden (apples, bananas, mangoes)
  "Vegetables": "#d4e8d0",    // Soft green (leafy greens, herbs)
  "Dairy": "#f0ece4",         // Creamy white (milk, curd, paneer)
  "Beverages": "#e2dcd4",     // Warm neutral (tea, coffee tones)
  "Snacks": "#f0e4d0",        // Golden warm (chips, biscuits)
  "Grocery Essentials": "#ebe5d8",  // Wheat/grain tone
  "Frozen Foods": "#e0e8f0",  // Cool blue-grey (ice, frozen packaging)
  "Personal Care": "#f0e8f0", // Soft lavender (cosmetics, soaps)
  "Household": "#e8eaec",     // Neutral grey (cleaning products)
  "Meat & Fish": "#f0dcd0",   // Warm peach (protein tones)
  "Bakery": "#f0e0c8",        // Warm bread/pastry tone
};

const DEFAULT_COLOR = "#f0ece8"; // Warm neutral (works for any category)

/**
 * Get a blur placeholder data URL for a product image.
 *
 * Returns a tiny SVG that renders as a colored rectangle.
 * When displayed with blur(20px) + scale(1.1), it creates
 * a smooth color-wash placeholder.
 *
 * @param category - Product category name
 * @returns base64 data URL (SVG, ~150 bytes)
 */
export function getBlurPlaceholder(category?: string): string {
  const color = (category && CATEGORY_COLORS[category]) || DEFAULT_COLOR;
  // SVG is more efficient than PNG for solid colors and doesn't need base64 encoding
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E`;
}

/**
 * Get the raw hex color for a category (for use as CSS backgroundColor).
 * Avoids the overhead of data URL generation when only the color is needed.
 */
export function getCategoryColor(category?: string): string {
  return (category && CATEGORY_COLORS[category]) || DEFAULT_COLOR;
}

/**
 * Generate a gradient placeholder for a more sophisticated blur effect.
 * Creates a subtle radial gradient that mimics depth/lighting.
 *
 * @param category - Product category name
 * @returns base64 data URL (SVG with gradient, ~300 bytes)
 */
export function getGradientPlaceholder(category?: string): string {
  const color = (category && CATEGORY_COLORS[category]) || DEFAULT_COLOR;
  // Slightly darken the color for the gradient edge
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cdefs%3E%3CradialGradient id='g'%3E%3Cstop offset='0%25' stop-color='${encodeURIComponent(color)}'/%3E%3Cstop offset='100%25' stop-color='${encodeURIComponent(color)}' stop-opacity='0.7'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='8' height='8' fill='url(%23g)'/%3E%3C/svg%3E`;
}

/**
 * Check if a blurDataURL is a real pre-computed blur (not just a category swatch).
 * Used to decide whether to apply heavy blur filter or show as-is.
 */
export function isPrecomputedBlur(blurDataURL?: string | null): boolean {
  if (!blurDataURL) return false;
  // Pre-computed blurs are typically PNG/WebP base64, not SVG
  return blurDataURL.startsWith("data:image/png") || blurDataURL.startsWith("data:image/webp");
}
