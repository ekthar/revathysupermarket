"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  // Hide on admin/login/staff/delivery pages (they have their own layouts)
  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/delivery") ||
    pathname === "/login" ||
    pathname === "/welcome";

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setShow(window.scrollY > 300);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (hidden) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-[calc(7.25rem+var(--safe-bottom))] right-[max(1rem,var(--safe-right))] z-50 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg press dark:border-slate-700 dark:bg-slate-800 md:bottom-8 md:right-8"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
