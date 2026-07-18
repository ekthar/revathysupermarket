"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { syncStatusBarToRoute } from "@/lib/native-bridge";

/**
 * Dynamically updates the meta[name="theme-color"] tag based on the current route
 * and the active color scheme (light/dark mode).
 *
 * Route-specific colors:
 * - /admin/*  -> "#1e293b" (dark slate for admin panel)
 * - /delivery/* -> "#059669" (emerald for delivery interface)
 * - Default light -> "#F7F7FA" (off-white per design system)
 * - Default dark  -> "#020617" (slate-950)
 */
function getThemeColor(pathname: string, isDark: boolean): string {
  if (pathname.startsWith("/admin")) {
    return "#1e293b";
  }
  if (pathname.startsWith("/delivery")) {
    return "#059669";
  }
  return isDark ? "#0A0A0A" : "#FFFFFF";
}

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function updateMetaThemeColor(color: string) {
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  metas.forEach((meta) => {
    meta.setAttribute("content", color);
  });
}

export function ThemeColorSync() {
  const pathname = usePathname();

  useEffect(() => {
    // Set initial theme color based on current route and theme
    const isDark = isDarkMode();
    updateMetaThemeColor(getThemeColor(pathname, isDark));
    // Also sync native status bar (no-op on web)
    syncStatusBarToRoute(pathname, isDark);

    // Observe class changes on <html> to detect theme toggling
    const observer = new MutationObserver(() => {
      const dark = isDarkMode();
      updateMetaThemeColor(getThemeColor(pathname, dark));
      syncStatusBarToRoute(pathname, dark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
