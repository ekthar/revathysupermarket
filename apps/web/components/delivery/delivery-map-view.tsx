"use client";

import { useEffect } from "react";

/**
 * GPS location publisher for the delivery partner.
 * Publishes coordinates every 5 seconds when the page is visible.
 */
export function DeliveryMapView() {
  useEffect(() => {
    if (!navigator.geolocation) return;
    let lastPublishedAt = 0;
    let request: AbortController | null = null;
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (document.visibilityState === "hidden" || now - lastPublishedAt < 5000) return;
        lastPublishedAt = now;
        request?.abort();
        request = new AbortController();
        void fetch("/api/delivery/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
          signal: request.signal,
        }).catch(() => null);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => {
      request?.abort();
      navigator.geolocation.clearWatch(watch);
    };
  }, []);

  // This component is invisible - it only publishes GPS data
  return null;
}
