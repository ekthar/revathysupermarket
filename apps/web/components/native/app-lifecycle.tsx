"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAppStateChange, syncStatusBarToRoute } from "@/lib/native-bridge";
import { isNative } from "@/lib/native-bridge";

/**
 * AppLifecycle — handles app foreground/background transitions.
 *
 * When the app returns to the foreground:
 * 1. Refreshes the current route data (Next.js router.refresh())
 * 2. Re-syncs status bar colors (in case system theme changed)
 *
 * This ensures stale data doesn't persist when users switch back
 * to the app after being away — matching native app behavior where
 * viewWillAppear/onResume always refreshes.
 */
export function AppLifecycle() {
  const router = useRouter();
  const lastBackgrounded = useRef<number>(0);

  useEffect(() => {
    if (!isNative) return;

    const cleanup = onAppStateChange((isActive) => {
      if (!isActive) {
        // App went to background — record timestamp
        lastBackgrounded.current = Date.now();
        return;
      }

      // App came to foreground
      const elapsed = Date.now() - lastBackgrounded.current;

      // Only refresh if app was in background for more than 30 seconds
      // (avoids unnecessary refetch for quick app-switcher peeks)
      if (elapsed > 30_000) {
        router.refresh();
      }

      // Re-sync status bar (theme may have changed while backgrounded)
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      void syncStatusBarToRoute(window.location.pathname, isDark);
    });

    return cleanup;
  }, [router]);

  return null;
}
