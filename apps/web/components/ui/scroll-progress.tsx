"use client";

import { motion, useScroll } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Scroll Progress Bar
 * 
 * Shows a thin progress indicator at the top of the viewport.
 * Hidden on admin panel (which has its own navigation) and login pages.
 * Uses z-index 49 to sit below modals (z-50+) and admin sticky headers (z-40).
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const pathname = usePathname();

  // Hide on admin, staff, delivery (they have their own layouts)
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/delivery") ||
    pathname === "/login" ||
    pathname === "/welcome"
  ) {
    return null;
  }

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-secondary-500 z-[49] origin-left pointer-events-none"
      style={{ scaleX: scrollYProgress }}
      aria-hidden="true"
    />
  );
}
