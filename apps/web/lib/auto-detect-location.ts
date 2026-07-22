"use client";

import { calculateDistanceKm } from "@/lib/distance";
import { SITE, STORE_COORDINATES } from "@/lib/constants";
import type { DeliveryLocation } from "@/components/location-prompt";

/**
 * Auto-Detect Location — silent GPS + reverse-geocode on first visit.
 *
 * Swiggy/Zomato pattern: the user's area name appears instantly in the header
 * without requiring any modal or interaction. This happens by:
 *
 * 1. Checking if geolocation permission is already "granted" (no prompt needed)
 * 2. If granted: silently get position → reverse-geocode → save → update UI
 * 3. If "prompt" or "denied": don't do anything (let LocationPrompt handle it)
 *
 * This creates the perception of "the app knows where I am" without being
 * invasive. Permission is only asked when the user explicitly taps the
 * location button or enters checkout.
 *
 * Key principle: NEVER show a permission prompt without user action.
 * We only auto-detect when permission was PREVIOUSLY granted.
 */

const STORAGE_KEY = "msm-delivery-location";
const AUTO_DETECT_KEY = "msm-auto-detect-done";

function estimateETA(distanceKm: number): string {
  if (distanceKm <= 1) return "10-15 min";
  if (distanceKm <= 2) return "15-20 min";
  if (distanceKm <= 3.5) return "20-25 min";
  if (distanceKm <= 5) return "25-35 min";
  return "35-45 min";
}

/**
 * Attempt silent auto-detection of user's location.
 *
 * Only runs if:
 * - No location is already saved
 * - Geolocation permission is already "granted" (no prompt)
 * - Browser supports Permissions API
 * - Not already attempted this session
 *
 * @returns The detected location, or null if auto-detection wasn't possible
 */
export async function autoDetectLocation(): Promise<DeliveryLocation | null> {
  // Skip if already saved
  if (typeof window === "undefined") return null;
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return null;

  // Skip if already attempted this session
  if (sessionStorage.getItem(AUTO_DETECT_KEY)) return null;
  sessionStorage.setItem(AUTO_DETECT_KEY, "1");

  // Check permission state WITHOUT triggering a prompt
  if (!navigator.permissions) return null;

  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    if (permission.state !== "granted") {
      // Permission not yet granted — don't auto-detect (avoid unexpected prompt)
      return null;
    }
  } catch {
    // Permissions API not supported for geolocation (Firefox)
    return null;
  }

  // Permission is granted — silently get position
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false, // Low accuracy is fine for area detection
        timeout: 5000, // Don't wait too long
        maximumAge: 600000, // Accept cached position up to 10 min old
      });
    });

    const { latitude: lat, longitude: lng } = position.coords;
    const distance = calculateDistanceKm({ lat, lng }, STORE_COORDINATES);
    const eta = estimateETA(distance);

    // Reverse geocode to get area name
    let area = "Your location";
    let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    let pincode: string | undefined;

    try {
      const res = await fetch(`/api/geocode/reverse?latitude=${lat}&longitude=${lng}`);
      if (res.ok) {
        const geo = await res.json();
        area = geo.locality || geo.street || geo.area || area;
        const parts = [geo.houseName, geo.street, geo.locality].filter(Boolean);
        if (parts.length > 0) address = parts.join(", ");
        pincode = geo.pincode || undefined;
      }
    } catch {
      // Geocode failed — use coordinates only
    }

    const location: DeliveryLocation = { lat, lng, address, area, pincode, eta };

    // Save and notify
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    window.dispatchEvent(new Event("location-updated"));

    return location;
  } catch {
    // Geolocation failed (GPS off, timeout, etc.) — silent failure
    return null;
  }
}

/**
 * Hook-friendly wrapper: call on app mount to attempt auto-detection.
 * Non-blocking — runs in background, never shows any UI.
 */
export function tryAutoDetect(): void {
  // Fire and forget — result is saved to localStorage automatically
  autoDetectLocation().catch(() => {});
}
