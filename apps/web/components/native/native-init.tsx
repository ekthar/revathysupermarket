"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initializeNativeApp, isNative, syncStatusBarToRoute, platform } from "@/lib/native-bridge";

/**
 * NativeInit — initializes Capacitor native features on app start.
 *
 * Responsibilities:
 * 1. Creates Android notification channels (delivery_alarm, order_alerts, etc.)
 * 2. Hides the native splash screen after first meaningful paint
 * 3. Sets edge-to-edge display (transparent navigation bar on Android)
 * 4. Syncs status bar style to current route on every navigation
 *
 * This component is placed in the root layout so it runs on ALL routes,
 * including deep links that bypass the homepage.
 */
export function NativeInit() {
  const pathname = usePathname();

  // Initialize native features on first mount
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void initializeNativeApp();
        void setEdgeToEdge();
      });
    });
  }, []);

  // Sync status bar on every route change
  useEffect(() => {
    if (!isNative) return;
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    void syncStatusBarToRoute(pathname, isDark);
  }, [pathname]);

  // Listen for system theme changes and re-sync status bar
  useEffect(() => {
    if (!isNative) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      void syncStatusBarToRoute(pathname, e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [pathname]);

  return null;
}

/**
 * Set edge-to-edge display on Android — makes the navigation bar transparent
 * so content draws behind it (like native Android apps with gesture navigation).
 */
async function setEdgeToEdge(): Promise<void> {
  if (!isNative || platform !== "android") return;
  try {
    // @ts-ignore — only available in Capacitor native shell
    const { NavigationBar } = await import(/* webpackIgnore: true */ "@capacitor/navigation-bar");
    if (NavigationBar) {
      await NavigationBar.setTransparency({ isTransparent: true });
    }
  } catch {
    // Plugin not available — not critical. On Android 10+ with gesture nav,
    // the system bar is already minimal.
  }
}
