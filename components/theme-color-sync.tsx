"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Dynamically updates the meta[name="theme-color"] tag based on the current route
 * and the active color scheme (light/dark mode).
 *
 * Route-specific colors:
 * - /admin/*  -> "#1e293b" (dark slate for admin panel)
 * - /delivery/* -> "#059669" (emerald for delivery interface)
 * - Default light -> "#FFFFFF" (iOS glass header is white-ish)
 * - Default dark  -> "#020617" (slate-950)
 */
function getThemeColor(pathname: string, isDark: boolean): string {
  if (pathname.startsWith("/admin")) {
    return "#1e293b";
  }
  if (pathname.startsWith("/delivery")) {
    return "#059669";
  }
  return isDark ? "#020617" : "#FFFFFF";
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
    updateMetaThemeColor(getThemeColor(pathname, isDarkMode()));

    // Observe class changes on <html> to detect theme toggling
    const observer = new MutationObserver(() => {
      updateMetaThemeColor(getThemeColor(pathname, isDarkMode()));
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
