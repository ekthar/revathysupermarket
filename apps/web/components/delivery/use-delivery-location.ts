"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LocationPermissionState = "checking" | "prompt" | "granted" | "denied" | "unsupported";

export type LiveCoords = { latitude: number; longitude: number; heading?: number | null };

// Minimal types for the native Capacitor background geolocation plugin
type BgLocation = { latitude: number; longitude: number; heading?: number | null; accuracy: number; altitude: number | null; bearing?: number | null };
type BgPlugin = {
  requestPermission: () => Promise<string>;
  addWatcher: (opts: any, cb: (location?: BgLocation, error?: any) => void) => Promise<string>;
  removeWatcher: (opts: { id: string }) => Promise<void>;
};

/**
 * Unified location hook that works in both PWA (browser Geolocation API) and
 * Capacitor native (background geolocation plugin) environments.
 *
 * When running inside a Capacitor native shell on Android/iOS, it uses the
 * @capacitor-community/background-geolocation plugin which keeps sending
 * location updates even when the app is backgrounded or the screen is off.
 * When running as a plain PWA in the browser, it falls back to
 * navigator.geolocation.watchPosition with the existing 5s-throttled publish.
 */
export function useDeliveryLocation(): UseDeliveryLocation {
  const [permission, setPermission] = useState<LocationPermissionState>("checking");
  const [coords, setCoords] = useState<LiveCoords | null>(null);
  const coordsRef = useRef<LiveCoords | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const bgWatcherRef = useRef<any>(null);

  const isNative = typeof window !== "undefined" && !!(window as any).Capacitor?.isNative;

  // ─── Native Capacitor background location ───
  const startNative = useCallback(async () => {
    try {
      const mod: any = await import("@capacitor-community/background-geolocation");
      const BackgroundGeolocation: BgPlugin = mod.BackgroundGeolocation ?? mod;
      const perm = await BackgroundGeolocation.requestPermission();
      if (perm !== "granted") { setPermission("denied"); return; }
      setPermission("granted");
      const watcherId = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "Revathy Delivery is tracking your location.",
          backgroundTitle: "Delivery Tracking Active",
          requestPermissions: true,
          stale: false,
          distanceFilter: 10,
        },
        (location, error) => {
          if (error || !location) return;
          const next: LiveCoords = {
            latitude: location.latitude,
            longitude: location.longitude,
            heading: location.heading,
          };
          coordsRef.current = next;
          setCoords(next);
          fetch("/api/delivery/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: next.latitude,
              longitude: next.longitude,
              heading: next.heading ?? undefined,
            }),
          }).catch(() => null);
        }
      );
      bgWatcherRef.current = { plugin: BackgroundGeolocation, watcherId };
    } catch {
      // Plugin not available — fall through to browser API
    }
  }, []);

  const stopNative = useCallback(async () => {
    try {
      if (bgWatcherRef.current) {
        const { plugin, watcherId } = bgWatcherRef.current;
        await plugin.removeWatcher({ id: watcherId });
        bgWatcherRef.current = null;
      }
    } catch { /* ignore */ }
  }, []);

  // ─── Web browser Geolocation API fallback ───
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

  // ─── On mount: detect environment & start tracking ───
  useEffect(() => {
    if (isNative) {
      startNative();
      return () => { stopNative(); };
    }
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
    return () => { active = false; };
  }, [isNative, startNative, stopNative]);

  useEffect(() => {
    if (isNative) return;
    if (permission !== "granted") return;
    startWatching();
    return stopWatching;
  }, [permission, startWatching, stopWatching, isNative]);

  // ─── Public API ───
  const requestPermission = useCallback(() => {
    if (isNative) { startNative(); return; }
    if (!navigator.geolocation) { setPermission("unsupported"); return; }
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
  }, [isNative, startNative]);

  const getFreshCoords = useCallback((): Promise<LiveCoords> => {
    return new Promise((resolve, reject) => {
      if (isNative && coordsRef.current) return resolve(coordsRef.current);
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
  }, [isNative]);

  const forcePublish = useCallback(async () => {
    const current = coordsRef.current;
    if (!current) return;
    await fetch("/api/delivery/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: current.latitude,
        longitude: current.longitude,
        heading: current.heading ?? undefined,
      }),
    }).catch(() => null);
  }, []);

  return { permission, coords, requestPermission, getFreshCoords, forcePublish };
}

export type UseDeliveryLocation = {
  permission: LocationPermissionState;
  coords: LiveCoords | null;
  requestPermission: () => void;
  getFreshCoords: () => Promise<LiveCoords>;
  forcePublish: () => Promise<void>;
};
