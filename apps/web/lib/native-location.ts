/**
 * Native Location — background GPS tracking for delivery partners.
 *
 * Uses Capacitor Geolocation for foreground and
 * @capacitor-community/background-geolocation for background tracking.
 *
 * Falls back to web Geolocation API when not native.
 */

import { isNative, platform } from "@/lib/native-bridge";

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

type LocationCallback = (location: LocationUpdate) => void;

let watchId: string | number | null = null;
let backgroundWatchId: any = null;
let isTracking = false;

/** Start foreground location tracking */
export async function startLocationTracking(
  callback: LocationCallback,
  options?: { interval?: number; highAccuracy?: boolean }
): Promise<void> {
  if (isTracking) return;
  isTracking = true;

  const highAccuracy = options?.highAccuracy ?? true;

  if (isNative) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Geolocation } = await import(/* webpackIgnore: true */ "@capacitor/geolocation");
      watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: highAccuracy, timeout: 10000 },
        (position: any, err: any) => {
          if (err || !position) return;
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          });
        }
      );
    } catch {
      startWebLocationTracking(callback, highAccuracy);
    }
  } else {
    startWebLocationTracking(callback, highAccuracy);
  }
}

/** Start background location tracking (delivery partners) */
export async function startBackgroundTracking(
  callback: LocationCallback,
  options?: { interval?: number; notificationTitle?: string }
): Promise<void> {
  if (!isNative || platform !== "android") {
    return startLocationTracking(callback, { interval: options?.interval });
  }

  try {
    // @ts-ignore — only available in Capacitor native shell
    const BackgroundGeolocation = await import(/* webpackIgnore: true */ "@capacitor-community/background-geolocation");

    backgroundWatchId = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: options?.notificationTitle || "Tracking delivery location",
        backgroundMessage: "Location is being shared with the store",
        requestPermissions: true,
        stale: false,
        distanceFilter: 10,
      },
      (location: any, error: any) => {
        if (error || !location) return;
        callback({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.bearing,
          timestamp: Date.now(),
        });
      }
    );
  } catch {
    await startLocationTracking(callback, { interval: options?.interval });
  }
}

/** Stop all location tracking */
export async function stopLocationTracking(): Promise<void> {
  isTracking = false;

  if (isNative && watchId !== null) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Geolocation } = await import(/* webpackIgnore: true */ "@capacitor/geolocation");
      await Geolocation.clearWatch({ id: watchId as string });
    } catch {}
    watchId = null;
  }

  if (backgroundWatchId !== null) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const BackgroundGeolocation = await import(/* webpackIgnore: true */ "@capacitor-community/background-geolocation");
      await BackgroundGeolocation.removeWatcher({ id: backgroundWatchId });
    } catch {}
    backgroundWatchId = null;
  }

  if (!isNative && watchId !== null) {
    navigator.geolocation.clearWatch(watchId as number);
    watchId = null;
  }
}

/** Get current position once */
export async function getCurrentPosition(): Promise<LocationUpdate | null> {
  if (isNative) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Geolocation } = await import(/* webpackIgnore: true */ "@capacitor/geolocation");
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        timestamp: pos.timestamp,
      };
    } catch {
      return null;
    }
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        timestamp: pos.timestamp,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/** Check if background tracking is active */
export function isBackgroundTrackingActive(): boolean {
  return backgroundWatchId !== null;
}

// ─── Web Fallback ────────────────────────────────────────────────────────────

function startWebLocationTracking(
  callback: LocationCallback,
  highAccuracy: boolean
): void {
  if (typeof navigator === "undefined" || !navigator.geolocation) return;
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      callback({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        timestamp: pos.timestamp,
      });
    },
    () => {},
    { enableHighAccuracy: highAccuracy, timeout: 10000, maximumAge: 5000 }
  );
}
