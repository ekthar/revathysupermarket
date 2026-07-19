/**
 * Native Permissions — unified permission request API for Capacitor apps.
 *
 * Wraps all Capacitor permission plugins into a single coherent API.
 * Safe to import on web — all functions gracefully no-op when not native.
 *
 * Usage:
 *   import { requestAllPermissions, getPermissionStatus } from "@/lib/native-permissions";
 *   const results = await requestAllPermissions("customer");
 */

import { isNative, platform } from "@/lib/native-bridge";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AppVariant = "customer" | "delivery" | "staff";

export type PermissionType =
  | "notifications"
  | "location"
  | "locationBackground"
  | "camera"
  | "exactAlarm"
  | "batteryOptimization";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unavailable";

export interface PermissionResult {
  type: PermissionType;
  status: PermissionStatus;
  required: boolean;
}

// ─── Permission Requirements Per Variant ─────────────────────────────────────

const VARIANT_PERMISSIONS: Record<AppVariant, { type: PermissionType; required: boolean }[]> = {
  customer: [
    { type: "notifications", required: true },
    { type: "location", required: true },
    { type: "camera", required: false },
  ],
  delivery: [
    { type: "notifications", required: true },
    { type: "location", required: true },
    { type: "locationBackground", required: true },
    { type: "camera", required: true },
    { type: "exactAlarm", required: true },
    { type: "batteryOptimization", required: true },
  ],
  staff: [
    { type: "notifications", required: true },
    { type: "exactAlarm", required: true },
    { type: "batteryOptimization", required: true },
  ],
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const PERMISSIONS_COMPLETED_KEY = "native-permissions-completed";
const PERMISSIONS_RESULTS_KEY = "native-permissions-results";

/** Check if the permission flow has been completed */
export function hasCompletedPermissions(): boolean {
  if (!isNative) return true; // Web doesn't need the gate
  try {
    return localStorage.getItem(PERMISSIONS_COMPLETED_KEY) === "true";
  } catch {
    return true;
  }
}

/** Mark permissions as completed */
export function markPermissionsCompleted(results: PermissionResult[]): void {
  try {
    localStorage.setItem(PERMISSIONS_COMPLETED_KEY, "true");
    localStorage.setItem(PERMISSIONS_RESULTS_KEY, JSON.stringify(results));
  } catch {}
}

/** Get saved permission results */
export function getSavedPermissionResults(): PermissionResult[] | null {
  try {
    const saved = localStorage.getItem(PERMISSIONS_RESULTS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// ─── Permission Checks ───────────────────────────────────────────────────────

/** Check current status of a specific permission */
export async function checkPermission(type: PermissionType): Promise<PermissionStatus> {
  if (!isNative) return "granted";

  try {
    switch (type) {
      case "notifications": {
        // @ts-ignore
        const { PushNotifications } = await import(/* webpackIgnore: true */ "@capacitor/push-notifications");
        const result = await PushNotifications.checkPermissions();
        return mapCapacitorStatus(result.receive);
      }
      case "location":
      case "locationBackground": {
        // @ts-ignore
        const { Geolocation } = await import(/* webpackIgnore: true */ "@capacitor/geolocation");
        const result = await Geolocation.checkPermissions();
        if (type === "locationBackground") {
          return mapCapacitorStatus(result.coarseLocation === "granted" ? result.location : result.coarseLocation);
        }
        return mapCapacitorStatus(result.location || result.coarseLocation);
      }
      case "camera": {
        // @ts-ignore
        const { Camera } = await import(/* webpackIgnore: true */ "@capacitor/camera");
        const result = await Camera.checkPermissions();
        return mapCapacitorStatus(result.camera);
      }
      case "exactAlarm": {
        // Android 12+ requires explicit permission for exact alarms
        if (platform === "android") {
          // @ts-ignore
          const { LocalNotifications } = await import(/* webpackIgnore: true */ "@capacitor/local-notifications");
          const result = await LocalNotifications.checkPermissions();
          return mapCapacitorStatus(result.display);
        }
        return "granted"; // iOS doesn't need this
      }
      case "batteryOptimization": {
        // Can't check programmatically — assume prompt needed on first ask
        return "prompt";
      }
      default:
        return "unavailable";
    }
  } catch {
    return "unavailable";
  }
}

/** Request a specific permission */
export async function requestPermission(type: PermissionType): Promise<PermissionStatus> {
  if (!isNative) return "granted";

  try {
    switch (type) {
      case "notifications": {
        // @ts-ignore
        const { PushNotifications } = await import(/* webpackIgnore: true */ "@capacitor/push-notifications");
        const result = await PushNotifications.requestPermissions();
        return mapCapacitorStatus(result.receive);
      }
      case "location": {
        // @ts-ignore
        const { Geolocation } = await import(/* webpackIgnore: true */ "@capacitor/geolocation");
        const result = await Geolocation.requestPermissions({ permissions: ["location"] });
        return mapCapacitorStatus(result.location || result.coarseLocation);
      }
      case "locationBackground": {
        // @ts-ignore
        const { Geolocation } = await import(/* webpackIgnore: true */ "@capacitor/geolocation");
        const result = await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
        // On Android 10+, background location requires a separate prompt AFTER foreground is granted
        return mapCapacitorStatus(result.location);
      }
      case "camera": {
        // @ts-ignore
        const { Camera } = await import(/* webpackIgnore: true */ "@capacitor/camera");
        const result = await Camera.requestPermissions({ permissions: ["camera"] });
        return mapCapacitorStatus(result.camera);
      }
      case "exactAlarm": {
        if (platform === "android") {
          // @ts-ignore
          const { LocalNotifications } = await import(/* webpackIgnore: true */ "@capacitor/local-notifications");
          const result = await LocalNotifications.requestPermissions();
          return mapCapacitorStatus(result.display);
        }
        return "granted";
      }
      case "batteryOptimization": {
        // Request battery optimization exemption (Android only)
        if (platform === "android") {
          try {
            // Use App plugin to open battery optimization settings
            // @ts-ignore
            const { App } = await import(/* webpackIgnore: true */ "@capacitor/app");
            // Opens the system battery optimization settings
            // On some devices this directly shows the exemption dialog
            await (App as any).openUrl?.({ url: "package:${android.packageName}" });
          } catch {}
        }
        return "granted"; // Best effort — can't guarantee
      }
      default:
        return "unavailable";
    }
  } catch {
    return "unavailable";
  }
}

/** Request all permissions for a given app variant */
export async function requestAllPermissions(variant: AppVariant): Promise<PermissionResult[]> {
  const permissions = VARIANT_PERMISSIONS[variant];
  const results: PermissionResult[] = [];

  for (const perm of permissions) {
    // First check if already granted
    let status = await checkPermission(perm.type);

    // If not granted, request it
    if (status === "prompt" || status === "unavailable") {
      status = await requestPermission(perm.type);
    }

    results.push({
      type: perm.type,
      status,
      required: perm.required,
    });
  }

  return results;
}

/** Get the list of permissions needed for a variant */
export function getRequiredPermissions(variant: AppVariant): { type: PermissionType; required: boolean }[] {
  return VARIANT_PERMISSIONS[variant];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapCapacitorStatus(status: string | undefined): PermissionStatus {
  switch (status) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    case "prompt":
    case "prompt-with-rationale":
      return "prompt";
    default:
      return "unavailable";
  }
}

/** Detect which app variant is currently running */
export function detectAppVariant(): AppVariant {
  if (typeof window === "undefined") return "customer";
  const url = window.location.href;
  if (url.includes("/delivery")) return "delivery";
  if (url.includes("/staff") || url.includes("/admin")) return "staff";
  return "customer";
}
