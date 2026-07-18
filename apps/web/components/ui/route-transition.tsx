"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const scrollPositions = new Map<string, number>();

/** Tab-level routes: skip heavy enter/exit so switches feel instant. */
const TAB_ROUTES = new Set(["/", "/products", "/cart", "/account", "/offers"]);

function isTabRoute(path: string) {
  if (TAB_ROUTES.has(path)) return true;
  if (path.startsWith("/products") && !path.includes("/products/")) return true;
  if (path.startsWith("/account")) return true;
  return false;
}

/**
 * A5: Direction-aware route transitions.
 *
 * Push (going deeper): new page slides in from right
 * Pop (going back): page slides out to the right
 * Tab switch: instant swap (no animation)
 *
 * Direction is detected via history length tracking:
 * - If history grows → push
 * - If popstate fires → pop
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const directionRef = useRef<"push" | "pop">("push");
  const historyDepthRef = useRef(0);

  // Listen for popstate (browser back/forward) to detect direction
  useEffect(() => {
    function handlePopState() {
      directionRef.current = "pop";
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const prev = prevPath.current;
    if (prev !== pathname) {
      scrollPositions.set(prev, window.scrollY);
      prevPath.current = pathname;
      // After processing, reset direction to push for next navigation
      // (popstate handler sets it to "pop" before this effect runs)
    }
    const saved = scrollPositions.get(pathname);
    if (saved !== undefined) {
      requestAnimationFrame(() => window.scrollTo(0, saved));
    } else {
      window.scrollTo(0, 0);
    }

    // Reset direction after applying — next nav defaults to push
    const resetTimer = setTimeout(() => {
      directionRef.current = "push";
    }, 50);
    return () => clearTimeout(resetTimer);
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

  const direction = directionRef.current;

  // A5: Directional variants
  const variants = {
    initial: direction === "pop"
      ? { opacity: 0.6, x: "-15%", scale: 0.97 }
      : { opacity: 0, x: "8%", scale: 0.99 },
    animate: { opacity: 1, x: "0%", scale: 1 },
    exit: direction === "pop"
      ? { opacity: 0, x: "20%" }
      : { opacity: 0.6, x: "-10%", scale: 0.97 },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
