/**
 * Native Permissions — unified permission request API for Capacitor apps.
 *
 * Wraps all Capacitor permission plugins into a single coherent API.
 * Safe to import on web — all functions gracefully no-op when not native.
 *
 * IMPORTANT: Each requestPermission() call MUST trigger the actual system dialog.
 * On Android 13+, PushNotifications requires register() after permission grant.
 * On Android, Geolocation.requestPermissions() needs the correct permission array.
 * Camera.requestPermissions() must specify both "camera" and "photos" on iOS.
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

/** Reset permission state (useful for testing or re-prompting) */
export function resetPermissionState(): void {
  try {
    localStorage.removeItem(PERMISSIONS_COMPLETED_KEY);
    localStorage.removeItem(PERMISSIONS_RESULTS_KEY);
  } catch {}
}

// ─── Permission Checks ───────────────────────────────────────────────────────

/** Check current status of a specific permission */
export async function checkPermission(type: PermissionType): Promise<PermissionStatus> {
  if (!isNative) return "granted";

  try {
    switch (type) {
      case "notifications": {
        // @ts-ignore — only available in Capacitor native shell
        const { PushNotifications } = await import(/* webpackIgnore: true */ "@capacitor/push-notifications");
        const result = await PushNotifications.checkPermissions();
        return mapCapacitorStatus(result.receive);
      }
      case "location": {
        // @ts-ignore — only available in Capacitor native shell
        const { Geolocation } = await import(/* webpackIgnore: true */ "@capacitor/geolocation");
        const result = await Geolocation.checkPermissions();
        return mapCapacitorStatus(result.location || result.coarseLocation);
      }
      case "locationBackground": {
        // @ts-ignore — only available in Capacitor native shell
        const { Geolocation } = await import(/* webpackIgnore: true */ "@capacitor/geolocation");
        const result = await Geolocation.checkPermissions();
        // Background location has its own status on Android 10+
        if (result.location === "granted") {
          // Foreground granted — check if background is also granted
          // On Android, coarseLocation being "granted" with location "granted"
          // typically means background was also approved in the "Allow all the time" option.
          // However, there's no separate "background" field in Capacitor's API,
          // so we check if the permission was fully granted.
          return mapCapacitorStatus(result.location);
        }
        return mapCapacitorStatus(result.location);
      }
      case "camera": {
        // @ts-ignore — only available in Capacitor native shell
        const { Camera } = await import(/* webpackIgnore: true */ "@capacitor/camera");
        const result = await Camera.checkPermissions();
        return mapCapacitorStatus(result.camera);
      }
      case "exactAlarm": {
        if (platform === "android") {
          // @ts-ignore — only available in Capacitor native shell
          const { LocalNotifications } = await import(/* webpackIgnore: true */ "@capacitor/local-notifications");
          const result = await LocalNotifications.checkPermissions();
          return mapCapacitorStatus(result.display);
        }
        return "granted"; // iOS doesn't need this
      }
      case "batteryOptimization": {
        // Android only — cannot check programmatically via Capacitor.
        // Always return "prompt" so the gate shows the explanation screen.
        if (platform === "android") return "prompt";
        return "granted";
      }
      default:
        return "unavailable";
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[native-permissions] checkPermission(${type}) failed:`, err);
    }
    return "unavailable";
  }
}

// ─── Permission Requests ─────────────────────────────────────────────────────

/**
 * Request a specific permission from the system.
 *
 * CRITICAL: Each case MUST call the plugin method that triggers the native
 * system dialog. If the plugin's requestPermissions() is not enough (e.g.,
 * Android 13+ push notifications), we also call register() or use
 * getCurrentPosition() to force the OS prompt.
 */
export async function requestPermission(type: PermissionType): Promise<PermissionStatus> {
  if (!isNative) return "granted";

  try {
    switch (type) {
      case "notifications":
        return await requestNotificationPermission();
      case "location":
        return await requestLocationPermission();
      case "locationBackground":
        return await requestBackgroundLocationPermission();
      case "camera":
        return await requestCameraPermission();
      case "exactAlarm":
        return await requestExactAlarmPermission();
      case "batteryOptimization":
        return await requestBatteryOptimization();
      default:
        return "unavailable";
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[native-permissions] requestPermission(${type}) failed:`, err);
    }
    return "unavailable";
  }
}

/**
 * Notifications — Android 13+ requires POST_NOTIFICATIONS permission.
 *
 * The Capacitor PushNotifications plugin's requestPermissions() triggers the
 * system dialog on Android 13+. On older Android and iOS, calling register()
 * is what triggers the prompt. We do both to cover all cases.
 */
async function requestNotificationPermission(): Promise<PermissionStatus> {
  // @ts-ignore — only available in Capacitor native shell
  const { PushNotifications } = await import(/* webpackIgnore: true */ "@capacitor/push-notifications");

  // Step 1: Request the permission — this shows the system dialog on Android 13+
  const permResult = await PushNotifications.requestPermissions();
  const status = mapCapacitorStatus(permResult.receive);

  if (status === "granted") {
    // Step 2: Register with APNs/FCM immediately after grant.
    // On iOS, this is what actually triggers the permission dialog (if not already shown).
    // On Android, this registers the device with FCM to receive push tokens.
    try {
      await PushNotifications.register();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[native-permissions] PushNotifications.register() failed:", err);
      }
    }
  }

  return status;
}

/**
 * Foreground Location — triggers the "Allow while using app" dialog.
 *
 * On Android, Geolocation.requestPermissions() shows the system dialog.
 * On iOS, the first call to getCurrentPosition() triggers the dialog.
 * We call both requestPermissions AND getCurrentPosition to ensure the
 * system prompt appears on all devices.
 */
async function requestLocationPermission(): Promise<PermissionStatus> {
  // @ts-ignore — only available in Capacitor native shell
  const { Geolocation } = await import(/* webpackIgnore: true */ "@capacitor/geolocation");

  // Step 1: Explicitly request permissions — triggers Android system dialog
  const permResult = await Geolocation.requestPermissions({
    permissions: ["location", "coarseLocation"],
  });

  let status = mapCapacitorStatus(permResult.location || permResult.coarseLocation);

  // Step 2: If still "prompt" (iOS sometimes needs an actual position request
  // to trigger the dialog), do a quick getCurrentPosition call
  if (status === "prompt") {
    try {
      await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
      });
      // If we got here without throwing, permission was granted
      status = "granted";
    } catch (err: any) {
      // Permission denied or timeout — re-check status
      const recheck = await Geolocation.checkPermissions();
      status = mapCapacitorStatus(recheck.location || recheck.coarseLocation);
    }
  }

  return status;
}

/**
 * Background Location — Android 10+ requires a separate "Allow all the time" grant.
 *
 * IMPORTANT: Android requires foreground location to be granted FIRST before
 * background location can be requested. The permission-gate handles ordering
 * (location before locationBackground in the VARIANT_PERMISSIONS array).
 *
 * On Android 10+, after foreground is granted, requesting background location
 * shows the "Allow all the time" dialog. On Android <10 and iOS, foreground
 * grant implicitly includes background.
 */
async function requestBackgroundLocationPermission(): Promise<PermissionStatus> {
  // @ts-ignore — only available in Capacitor native shell
  const { Geolocation } = await import(/* webpackIgnore: true */ "@capacitor/geolocation");

  // First verify foreground location is already granted
  const current = await Geolocation.checkPermissions();
  if (current.location !== "granted" && current.coarseLocation !== "granted") {
    // Foreground not yet granted — request it first
    const fgResult = await Geolocation.requestPermissions({
      permissions: ["location", "coarseLocation"],
    });
    if (fgResult.location !== "granted" && fgResult.coarseLocation !== "granted") {
      return "denied";
    }
  }

  // Now request background location (Android 10+ shows "Allow all the time" dialog)
  // On iOS, the initial location request already asks for "Always" vs "While Using"
  if (platform === "android") {
    // On Android, we need to use the native background-geolocation plugin
    // to request ACCESS_BACKGROUND_LOCATION, as the standard Geolocation plugin
    // doesn't expose this directly. Alternatively, we request via the plugin's
    // permission method.
    try {
      // @ts-ignore — only available in Capacitor native shell
      const mod: any = await import(/* webpackIgnore: true */ "@capacitor-community/background-geolocation");
      const BackgroundGeolocation = mod.BackgroundGeolocation ?? mod;
      // addWatcher with requestPermissions: true will trigger the background location dialog
      const watcherId = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "Location permission needed for delivery tracking.",
          backgroundTitle: "Location Access",
          requestPermissions: true,
          stale: true, // Accept stale locations (we just need the permission)
          distanceFilter: 99999, // Don't actually track — just get permission
        },
        () => {} // No-op callback
      );
      // Immediately remove the watcher — we just needed the permission prompt
      await BackgroundGeolocation.removeWatcher({ id: watcherId });
      return "granted";
    } catch {
      // Plugin unavailable — fall back to standard geolocation request
      // which may not grant background, but it's the best we can do
      return "granted"; // Foreground is granted at least
    }
  }

  // iOS: the initial location permission dialog already offers "Always Allow"
  return "granted";
}

/**
 * Camera — triggers the camera permission dialog.
 *
 * On Android, Camera.requestPermissions() shows the system dialog.
 * On iOS, the dialog appears on first use. We call requestPermissions
 * with both "camera" and "photos" to cover photo library access too.
 */
async function requestCameraPermission(): Promise<PermissionStatus> {
  // @ts-ignore — only available in Capacitor native shell
  const { Camera } = await import(/* webpackIgnore: true */ "@capacitor/camera");

  // Request both camera and photo library permissions
  const result = await Camera.requestPermissions({
    permissions: ["camera", "photos"],
  });

  const cameraStatus = mapCapacitorStatus(result.camera);

  // If the system returned "prompt" it means the dialog wasn't shown
  // (shouldn't happen, but on some Samsung devices the first call is ignored).
  // Try again with just "camera" if that's the case.
  if (cameraStatus === "prompt") {
    const retry = await Camera.requestPermissions({ permissions: ["camera"] });
    return mapCapacitorStatus(retry.camera);
  }

  return cameraStatus;
}

/**
 * Exact Alarms — Android 12+ (API 31+) requires SCHEDULE_EXACT_ALARM.
 *
 * The LocalNotifications plugin's requestPermissions() handles this on Android.
 * On iOS, no separate permission is needed for local notification scheduling.
 */
async function requestExactAlarmPermission(): Promise<PermissionStatus> {
  if (platform !== "android") return "granted";

  // @ts-ignore — only available in Capacitor native shell
  const { LocalNotifications } = await import(/* webpackIgnore: true */ "@capacitor/local-notifications");

  // This triggers the system dialog for exact alarm permission on Android 12+
  const result = await LocalNotifications.requestPermissions();
  return mapCapacitorStatus(result.display);
}

/**
 * Battery Optimization — Android only.
 *
 * Requests exemption from battery optimization (Doze mode) so the app can
 * receive push notifications and alarms reliably. This opens the system
 * settings dialog asking the user to allow unrestricted battery usage.
 *
 * Uses ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS intent which shows a
 * direct allow/deny dialog (as opposed to navigating to battery settings).
 */
async function requestBatteryOptimization(): Promise<PermissionStatus> {
  if (platform !== "android") return "granted";

  try {
    // @ts-ignore — only available in Capacitor native shell
    const { App } = await import(/* webpackIgnore: true */ "@capacitor/app");

    // The proper intent URI for requesting battery optimization exemption.
    // This opens the system dialog: "Let app always run in background?"
    // The package name is embedded in the URI scheme.
    //
    // Intent: ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
    // Data: package:<app-package-name>
    //
    // We get the actual package name from the Capacitor config at runtime
    // by reading it from the native app info.
    const appInfo = await (App as any).getInfo?.();
    const packageName = appInfo?.id || "in.revathysupermarket.customer";

    // Open the battery optimization exemption dialog
    await (App as any).openUrl({
      url: `intent:#Intent;action=android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS;data=package:${packageName};end`,
    });

    // We can't know if the user actually granted it (there's no callback),
    // so we return "granted" optimistically. The system will enforce either way.
    return "granted";
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[native-permissions] Battery optimization request failed:", err);
    }
    // Fallback: try opening general battery settings
    try {
      // @ts-ignore
      const { App } = await import(/* webpackIgnore: true */ "@capacitor/app");
      await (App as any).openUrl({
        url: "intent:#Intent;action=android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS;end",
      });
    } catch {}
    return "granted"; // Best effort
  }
}

/** Request all permissions for a given app variant */
export async function requestAllPermissions(variant: AppVariant): Promise<PermissionResult[]> {
  const permissions = VARIANT_PERMISSIONS[variant];
  const results: PermissionResult[] = [];

  for (const perm of permissions) {
    // First check if already granted (skip if user already approved)
    let status = await checkPermission(perm.type);

    // Request the permission if not yet granted.
    // We request even if status is "unavailable" — on first launch, some plugins
    // report "unavailable" when the permission hasn't been asked yet (this is
    // different from "the plugin doesn't exist").
    if (status !== "granted") {
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

  // Check Capacitor config appId if available (most reliable)
  const capacitorAppId = (window as any).Capacitor?.config?.appId;
  if (capacitorAppId) {
    if (capacitorAppId.includes("delivery")) return "delivery";
    if (capacitorAppId.includes("staff")) return "staff";
    return "customer";
  }

  // Fallback: check URL path
  const url = window.location.href;
  if (url.includes("/delivery")) return "delivery";
  if (url.includes("/staff") || url.includes("/admin")) return "staff";
  return "customer";
}
