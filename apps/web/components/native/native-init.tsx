"use client";

import { useEffect } from "react";
import { initializeNativeApp } from "@/lib/native-bridge";

/**
 * NativeInit — initializes Capacitor native features on app start.
 *
 * Responsibilities:
 * 1. Creates Android notification channels (delivery_alarm, order_alerts, etc.)
 * 2. Hides the native splash screen after first meaningful paint
 *
 * This component is placed in the root layout so it runs on ALL routes,
 * including deep links that bypass the homepage. The customer config uses
 * `launchAutoHide: false`, so we must explicitly hide the splash.
 *
 * Delivery and Staff configs use `launchAutoHide: true`, so the splash
 * auto-hides — but calling `hideSplash()` again is a safe no-op.
 */
export function NativeInit() {
  useEffect(() => {
    // Wait for two animation frames to ensure content is painted,
    // then initialize native features (channels + hide splash).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void initializeNativeApp();
      });
    });
  }, []);

  return null;
}
