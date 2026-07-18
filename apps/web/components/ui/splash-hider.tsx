"use client";

import { useEffect } from "react";
import { hideSplash } from "@/lib/native-bridge";

/**
 * SplashHider — hides the native Capacitor splash screen after first paint.
 *
 * The Capacitor config has `launchAutoHide: false`, so the splash stays
 * visible until we explicitly dismiss it. This prevents the white flash
 * between splash and WebView content.
 *
 * Place this component on the homepage (or root layout) so the splash
 * is hidden once meaningful content is painted.
 */
export function SplashHider() {
  useEffect(() => {
    // Wait for two animation frames to ensure content is painted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hideSplash();
      });
    });
  }, []);

  return null;
}
