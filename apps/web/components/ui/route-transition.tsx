"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const scrollPositions = new Map<string, number>();

/** Tab-level routes: instant swap, no animation overhead. */
const TAB_ROUTES = new Set(["/", "/products", "/cart", "/account", "/offers"]);

function isTabRoute(path: string) {
  if (TAB_ROUTES.has(path)) return true;
  if (path.startsWith("/products") && !path.includes("/products/")) return true;
  if (path.startsWith("/account")) return true;
  return false;
}

/**
 * RouteTransition — lightweight scroll-restore + subtle CSS fade.
 *
 * Apple approach: tab switches are INSTANT (no animation = feels native).
 * Depth navigation (product pages, checkout) gets a simple CSS fade (no
 * AnimatePresence, no unmount/remount delay, no white flash).
 *
 * This replaces the heavy Framer Motion AnimatePresence approach that caused
 * a visible flash and 200ms delay on every navigation.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    const prev = prevPath.current;
    if (prev !== pathname) {
      scrollPositions.set(prev, window.scrollY);
      prevPath.current = pathname;
    }
    const saved = scrollPositions.get(pathname);
    if (saved !== undefined) {
      requestAnimationFrame(() => window.scrollTo(0, saved));
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  const soft = isTabRoute(pathname);

  return (
    <div key={pathname} className={soft ? "route-soft-enter" : "animate-fadeIn"}>
      {children}
    </div>
  );
}
