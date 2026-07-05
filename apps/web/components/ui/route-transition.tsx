"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { springs } from "@/lib/motion";

// Animates between route changes so navigation feels like a native transition
// instead of a hard content swap. `mode="wait"` sequences exit-then-enter so
// the two pages never render stacked (which would otherwise shift layout).
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={springs.enter}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
