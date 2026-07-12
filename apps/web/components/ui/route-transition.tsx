"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const scrollPositions = new Map<string, number>();

/** Tab-level routes: skip heavy enter/exit so switches feel instant. */
const TAB_ROUTES = new Set(["/", "/products", "/cart", "/account", "/offers"]);

function isTabRoute(path: string) {
  if (TAB_ROUTES.has(path)) return true;
  if (path.startsWith("/products")) return true;
  if (path.startsWith("/account")) return true;
  return false;
}

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

  // Tab navigation: no remount animation — just content swap + scroll restore.
  if (soft) {
    return (
      <div key={pathname} className="route-soft-enter">
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
