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
    const { StatusBar, Style } = await import("@capacitor/status-bar");

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
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
  } catch {}
}

export async function setStatusBarDark(): Promise<void> {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
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
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
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
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
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
    const { Haptics } = await import("@capacitor/haptics");
    await Haptics.selectionChanged();
  } catch {
    navigator.vibrate?.(3);
  }
}

// ─── Keyboard ────────────────────────────────────────────────────────────────

export async function setKeyboardStyle(isDark: boolean): Promise<void> {
  if (!isNative) return;
  try {
    const { Keyboard, KeyboardStyle } = await import("@capacitor/keyboard");
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
  import("@capacitor/app").then(({ App }) => {
    listener = App.addListener("backButton", ({ canGoBack }) => {
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
  import("@capacitor/app").then(({ App }) => {
    listener = App.addListener("appStateChange", ({ isActive }) => cb(isActive));
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
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {}
}
