/**
 * Native Bridge — unified interface for Capacitor native APIs.
 *
 * All functions gracefully fall back to web equivalents when not running
 * inside the Capacitor native shell. Safe to import anywhere.
 *
 * Usage:
 *   import { isNative, hapticImpact, syncStatusBarToRoute } from "@/lib/native-bridge";
 */

// ─── Platform Detection ──────────────────────────────────────────────────────

/** Whether we're running inside a Capacitor native shell */
export const isNative: boolean =
  typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();

/** Current platform: 'android' | 'ios' | 'web' */
export const platform: "android" | "ios" | "web" =
  typeof window !== "undefined" && (window as any).Capacitor?.getPlatform?.() || "web";

// ─── Status Bar ──────────────────────────────────────────────────────────────

/**
 * Sync status bar color/style to the current route and theme.
 * Falls back to meta theme-color update on web.
 */
export async function syncStatusBarToRoute(pathname: string, isDark: boolean): Promise<void> {
  if (!isNative) return;

  try {
    // @ts-ignore — only available in Capacitor native shell
    const { StatusBar, Style } = await import(/* webpackIgnore: true */ "@capacitor/status-bar");

    if (pathname.startsWith("/admin")) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#1e293b" });
    } else if (pathname.startsWith("/delivery")) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#059669" });
    } else {
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
      await StatusBar.setBackgroundColor({ color: isDark ? "#0A0A0A" : "#FFFFFF" });
    }
  } catch {
    // Plugin not available — ignore
  }
}

export async function setStatusBarLight(): Promise<void> {
  if (!isNative) return;
  try {
    // @ts-ignore — only available in Capacitor native shell
    const { StatusBar, Style } = await import(/* webpackIgnore: true */ "@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
  } catch {}
}

export async function setStatusBarDark(): Promise<void> {
  if (!isNative) return;
  try {
    // @ts-ignore — only available in Capacitor native shell
    const { StatusBar, Style } = await import(/* webpackIgnore: true */ "@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0A0A0A" });
  } catch {}
}

// ─── Haptics ─────────────────────────────────────────────────────────────────

/**
 * Native haptic impact feedback.
 * Falls back to navigator.vibrate on web.
 */
export async function hapticImpact(style: "light" | "medium" | "heavy" = "light"): Promise<void> {
  if (!isNative) {
    const durations: Record<string, number> = { light: 5, medium: 10, heavy: 20 };
    navigator.vibrate?.(durations[style]);
    return;
  }
  try {
    // @ts-ignore — only available in Capacitor native shell
    const { Haptics, ImpactStyle } = await import(/* webpackIgnore: true */ "@capacitor/haptics");
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch {
    const durations: Record<string, number> = { light: 5, medium: 10, heavy: 20 };
    navigator.vibrate?.(durations[style]);
  }
}

/**
 * Native haptic notification feedback (success/warning/error).
 */
export async function hapticNotification(type: "success" | "warning" | "error" = "success"): Promise<void> {
  if (!isNative) {
    const patterns = { success: [10, 30, 10], warning: [10, 20, 10, 20, 10], error: [20, 40, 20] };
    navigator.vibrate?.(patterns[type]);
    return;
  }
  try {
    // @ts-ignore — only available in Capacitor native shell
    const { Haptics, NotificationType } = await import(/* webpackIgnore: true */ "@capacitor/haptics");
    const map = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error };
    await Haptics.notification({ type: map[type] });
  } catch {}
}

/**
 * Native haptic selection feedback (picker tick, scroll snap).
 */
export async function hapticSelection(): Promise<void> {
  if (!isNative) {
    navigator.vibrate?.(3);
    return;
  }
  try {
    // @ts-ignore — only available in Capacitor native shell
    const { Haptics } = await import(/* webpackIgnore: true */ "@capacitor/haptics");
    await Haptics.selectionChanged();
  } catch {
    navigator.vibrate?.(3);
  }
}

// ─── Keyboard ────────────────────────────────────────────────────────────────

export async function setKeyboardStyle(isDark: boolean): Promise<void> {
  if (!isNative) return;
  try {
    // @ts-ignore — only available in Capacitor native shell
    const { Keyboard, KeyboardStyle } = await import(/* webpackIgnore: true */ "@capacitor/keyboard");
    await Keyboard.setStyle({ style: isDark ? KeyboardStyle.Dark : KeyboardStyle.Light });
  } catch {}
}

// ─── App Lifecycle & Navigation ──────────────────────────────────────────────

/**
 * Register Android hardware back button handler.
 * Returns a cleanup function.
 */
export function registerBackButton(handler: () => void): () => void {
  if (!isNative) return () => {};

  let listener: any;
  // @ts-ignore — only available in Capacitor native shell
  import(/* webpackIgnore: true */ "@capacitor/app").then(({ App }: any) => {
    listener = App.addListener("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
      if (canGoBack) {
        handler();
      } else {
        App.exitApp();
      }
    });
  }).catch(() => {});

  return () => {
    listener?.remove?.();
  };
}

/**
 * Listen for app state changes (foreground/background).
 * Returns a cleanup function.
 */
export function onAppStateChange(cb: (isActive: boolean) => void): () => void {
  if (!isNative) return () => {};

  let listener: any;
  // @ts-ignore — only available in Capacitor native shell
  import(/* webpackIgnore: true */ "@capacitor/app").then(({ App }: any) => {
    listener = App.addListener("appStateChange", ({ isActive }: { isActive: boolean }) => cb(isActive));
  }).catch(() => {});

  return () => {
    listener?.remove?.();
  };
}

// ─── Splash Screen ───────────────────────────────────────────────────────────

/**
 * Hide the native splash screen (call after first meaningful paint).
 */
export async function hideSplash(): Promise<void> {
  if (!isNative) return;
  try {
    // @ts-ignore — only available in Capacitor native shell
    const { SplashScreen } = await import(/* webpackIgnore: true */ "@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {}
}


// ─── Notification Channels (Android) ─────────────────────────────────────────

/**
 * Create Android notification channels on app start.
 * Must be called early (before any notification is sent).
 * iOS ignores this — channels are Android-only.
 *
 * Channels:
 * - delivery_alarm: MAX priority, custom sound, bypass DND, full-screen intent
 * - order_alerts: HIGH priority, custom sound, heads-up
 * - order_updates: DEFAULT priority, system sound
 * - promotions: LOW priority, no sound
 */
export async function createNotificationChannels(): Promise<void> {
  if (!isNative || platform !== "android") return;

  try {
    // @ts-ignore
    const { LocalNotifications } = await import(/* webpackIgnore: true */ "@capacitor/local-notifications");

    await LocalNotifications.createChannel({
      id: "delivery_alarm",
      name: "Delivery Assignments",
      description: "Critical alerts when a new delivery is assigned to you",
      importance: 5, // MAX
      visibility: 1, // PUBLIC
      sound: "delivery_alarm.wav",
      vibration: true,
      lights: true,
      lightColor: "#059669",
    });

    await LocalNotifications.createChannel({
      id: "order_alerts",
      name: "New Orders",
      description: "Alerts when a new order comes in (staff/admin)",
      importance: 4, // HIGH
      visibility: 1,
      sound: "order_alert.wav",
      vibration: true,
      lights: true,
      lightColor: "#22C55E",
    });

    await LocalNotifications.createChannel({
      id: "order_updates",
      name: "Order Updates",
      description: "Status updates for your orders (preparing, dispatched, delivered)",
      importance: 3, // DEFAULT
      visibility: 0, // PRIVATE
      sound: "notification.wav",
      vibration: true,
    });

    await LocalNotifications.createChannel({
      id: "promotions",
      name: "Promotions & Offers",
      description: "Special deals and promotional offers",
      importance: 2, // LOW
      visibility: 0,
      vibration: false,
    });

    await LocalNotifications.createChannel({
      id: "location_tracking",
      name: "Location Tracking",
      description: "Shows while your location is being shared during deliveries",
      importance: 2, // LOW (persistent, not intrusive)
      visibility: 0,
      vibration: false,
    });

  } catch {
    // LocalNotifications plugin not available — ignore
  }
}

// ─── App Initialization ──────────────────────────────────────────────────────

/**
 * Initialize all native features on app start.
 * Call once from the root layout or providers component.
 */
export async function initializeNativeApp(): Promise<void> {
  if (!isNative) return;

  // Create notification channels (Android)
  await createNotificationChannels();

  // Hide splash after initialization
  await hideSplash();
}
