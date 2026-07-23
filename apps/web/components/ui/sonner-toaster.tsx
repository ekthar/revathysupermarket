"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Toast Configuration — iOS-native style.
 *
 * Design decisions:
 * - Position: top-center (iOS pattern — never overlaps bottom nav/cart)
 * - Style: pill-shaped, dark glass with backdrop blur
 * - Safe area: respects notch/status bar via CSS offset
 * - Duration: 2.5s default (long enough to read, short enough to not annoy)
 * - Max width: capped for large screens
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset={{ top: "calc(env(safe-area-inset-top, 12px) + 0.75rem)" }}
      gap={6}
      duration={2500}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "font-sans flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold text-white shadow-xl max-w-[min(92vw,22rem)] ios-toast-glass",
          actionButton:
            "ml-auto shrink-0 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white hover:bg-white/30 transition-colors",
          cancelButton:
            "ml-1 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white/70 hover:text-white transition-colors",
        },
      }}
    />
  );
}
