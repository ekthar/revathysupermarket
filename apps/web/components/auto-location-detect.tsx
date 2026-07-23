"use client";

import { useEffect } from "react";
import { tryAutoDetect } from "@/lib/auto-detect-location";

/**
 * AutoLocationDetect — silently detects user's location on first visit.
 *
 * Runs once on mount. If geolocation permission is already granted
 * (from a previous session), it silently gets the position, reverse-geocodes,
 * and saves the location. The header's LocationIndicator reacts to the
 * "location-updated" event and shows the area name instantly.
 *
 * If permission is NOT granted, does nothing (no prompt, no UI).
 * The LocationPrompt modal handles first-time permission flow separately.
 *
 * Mount in the app layout — no visual output.
 */
export function AutoLocationDetect() {
  useEffect(() => {
    // Delay slightly so it doesn't compete with initial hydration
    const timer = setTimeout(() => tryAutoDetect(), 1500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
