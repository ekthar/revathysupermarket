"use client";

/**
 * Skip-to-content link for keyboard/screen-reader accessibility.
 * 
 * Visually hidden until focused, then appears at the top of the page.
 * Allows keyboard users to bypass the header and navigation.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="fixed top-2 left-2 z-[200] -translate-y-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
    >
      Skip to content
    </a>
  );
}
