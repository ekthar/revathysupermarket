"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * NavigationDirection — tracks forward/back navigation direction.
 *
 * Sets `data-nav-direction="forward"|"back"` on <html> element.
 * View Transitions CSS uses this to apply directional animations:
 * - Forward (deeper): content slides in from the right
 * - Back (shallower): content slides out to the right
 * - Tab switches: no animation (instant, like native tab bar)
 *
 * Detection logic:
 * 1. Browser back/forward: `popstate` event → "back"
 * 2. Deeper route (more segments): "forward"
 * 3. Shallower route (fewer segments): "back"
 * 4. Same depth tab routes: "none" (no direction)
 */

/** Tab-level routes: never get slide animation */
const TAB_ROUTES = new Set(["/", "/products", "/cart", "/account", "/offers", "/dashboard"]);

function isTabRoute(path: string) {
  if (TAB_ROUTES.has(path)) return true;
  if (path === "/products" || (path.startsWith("/products") && !path.includes("/products/"))) return true;
  if (path.startsWith("/account") && path.split("/").length <= 2) return true;
  return false;
}

function getDepth(path: string): number {
  return path.split("/").filter(Boolean).length;
}

export function NavigationDirection() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const wasPopState = useRef(false);

  // Listen for popstate (browser back/forward button)
  useEffect(() => {
    const handlePop = () => {
      wasPopState.current = true;
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  useEffect(() => {
    const prev = prevPathname.current;
    if (prev === pathname) return;

    let direction: "forward" | "back" | "none";

    if (wasPopState.current) {
      // Browser back/forward → always "back"
      direction = "back";
      wasPopState.current = false;
    } else if (isTabRoute(prev) && isTabRoute(pathname)) {
      // Tab-to-tab switch → no animation
      direction = "none";
    } else {
      // Programmatic navigation: compare depth
      const prevDepth = getDepth(prev);
      const currDepth = getDepth(pathname);
      direction = currDepth > prevDepth ? "forward" : currDepth < prevDepth ? "back" : "none";
    }

    document.documentElement.setAttribute("data-nav-direction", direction);
    prevPathname.current = pathname;

    // Clear direction after transition completes (prevent stale state)
    const timer = setTimeout(() => {
      document.documentElement.removeAttribute("data-nav-direction");
    }, 400);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
