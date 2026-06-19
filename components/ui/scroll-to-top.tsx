"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  // Hide on admin/login/staff pages
  const hidden = pathname.startsWith("/admin") || pathname.startsWith("/staff") || pathname === "/login" || pathname === "/welcome";

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
          className="fixed bottom-[130px] right-4 z-50 md:bottom-8 md:right-8 h-10 w-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center press"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
