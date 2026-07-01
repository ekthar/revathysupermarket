"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LocationPermissionState = "checking" | "prompt" | "granted" | "denied" | "unsupported";

export type LiveCoords = { latitude: number; longitude: number; heading?: number | null };

/**
 * Compulsory GPS for delivery partners.
 *
 * Location is not optional for a delivery rider: it is what proves arrival
 * at the customer's door (server-side, within 100m) and what lets the
 * customer see the rider moving on the live map. This hook:
 *
 * 1. Reports the current permission state (checking/prompt/granted/denied).
 * 2. Once granted, continuously watches position and publishes it to
 *    `/api/delivery/location` every 5s (replaces the old silent
 *    DeliveryMapView-only publisher).
 * 3. Exposes the latest known coordinates so the caller can attach them to
 *    the "Mark Arrived" / GPS-verified actions.
 */
export function useDeliveryLocation(): UseDeliveryLocation {
  const [permission, setPermission] = useState<LocationPermissionState>("checking");
  const [coords, setCoords] = useState<LiveCoords | null>(null);
  const coordsRef = useRef<LiveCoords | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;
    let lastPublishedAt = 0;
    let request: AbortController | null = null;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const next: LiveCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading,
        };
        coordsRef.current = next;
        setCoords(next);
        setPermission("granted");

        const now = Date.now();
        if (document.visibilityState === "hidden" || now - lastPublishedAt < 5000) return;
        lastPublishedAt = now;
        request?.abort();
        request = new AbortController();
        void fetch("/api/delivery/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: next.latitude,
            longitude: next.longitude,
            heading: next.heading ?? undefined,
          }),
          signal: request.signal,
        }).catch(() => null);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setPermission("denied");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // On mount: check existing permission state without prompting (where supported).
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      return;
    }
    if (!navigator.permissions?.query) {
      setPermission("prompt");
      return;
    }
    let active = true;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (!active) return;
        setPermission(status.state === "granted" ? "granted" : status.state === "denied" ? "denied" : "prompt");
        status.onchange = () => {
          if (!active) return;
          setPermission(status.state === "granted" ? "granted" : status.state === "denied" ? "denied" : "prompt");
        };
      })
      .catch(() => setPermission("prompt"));
    return () => {
      active = false;
    };
  }, []);

  // Once granted, start the live watcher; stop it on unmount.
  useEffect(() => {
    if (permission !== "granted") return;
    startWatching();
    return stopWatching;
  }, [permission, startWatching, stopWatching]);

  /** Triggers the native browser permission prompt (must be called from a user gesture). */
  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        coordsRef.current = { latitude: position.coords.latitude, longitude: position.coords.longitude, heading: position.coords.heading };
        setCoords(coordsRef.current);
        setPermission("granted");
      },
      (error) => {
        setPermission(error.code === error.PERMISSION_DENIED ? "denied" : "prompt");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  /** Fetches a fresh single fix (used right before a GPS-verified action like "Mark Arrived"). */
  const getFreshCoords = useCallback((): Promise<LiveCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Location is not available on this device."));
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next: LiveCoords = { latitude: position.coords.latitude, longitude: position.coords.longitude, heading: position.coords.heading };
          coordsRef.current = next;
          setCoords(next);
          resolve(next);
        },
        () => {
          if (coordsRef.current) return resolve(coordsRef.current);
          reject(new Error("Could not get your current location."));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    });
  }, []);

  return { permission, coords, requestPermission, getFreshCoords };
}

export type UseDeliveryLocation = {
  permission: LocationPermissionState;
  coords: LiveCoords | null;
  requestPermission: () => void;
  getFreshCoords: () => Promise<LiveCoords>;
};
