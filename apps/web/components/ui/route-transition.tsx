"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const scrollPositions = new Map<string, number>();

/** Tab-level routes: instant swap, zero animation. */
const TAB_ROUTES = new Set(["/", "/products", "/cart", "/account", "/offers"]);

function isTabRoute(path: string) {
  if (TAB_ROUTES.has(path)) return true;
  if (path.startsWith("/products") && !path.includes("/products/")) return true;
  if (path.startsWith("/account")) return true;
  return false;
}

/**
 * RouteTransition — Apple-native page transitions WITHOUT remounting.
 *
 * The previous implementation used `key={pathname}` which caused React to
 * unmount and remount the entire page content on every navigation — this is
 * the root cause of the flash.
 *
 * Apple's approach: content is ALWAYS mounted. Navigation simply restores
 * scroll position. There is NO opacity animation on route change because
 * iOS native apps don't flash between views — they just appear.
 *
 * The only visual cue is scroll-to-top for new pages.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip scroll logic on first render (SSR hydration)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const prev = prevPath.current;
    if (prev !== pathname) {
      // Save current scroll position for the page we're leaving
      scrollPositions.set(prev, window.scrollY);
      prevPath.current = pathname;
    }

    // Restore saved scroll position or scroll to top
    const saved = scrollPositions.get(pathname);
    if (saved !== undefined && isTabRoute(pathname)) {
      // Tab routes: restore their scroll position (feels native)
      requestAnimationFrame(() => window.scrollTo(0, saved));
    } else if (prev !== pathname) {
      // Depth routes: scroll to top instantly
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // No key prop = no remount = no flash
  return <>{children}</>;
}
