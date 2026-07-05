"use client";

import { motion } from "framer-motion";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function ProgressDots({ current, total = 4 }: { current: number; total?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <motion.span
          key={index}
          animate={{ width: index <= current ? 20 : 6 }}
          transition={springs.enter}
          className={cn(
            "h-1.5 rounded-full transition-colors",
            index <= current ? "bg-primary" : "bg-slate-200 dark:bg-white/15"
          )}
        />
      ))}
    </div>
  );
}
