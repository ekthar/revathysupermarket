"use client";

import { cn } from "@/lib/utils";

export function ProgressDots({ current, total = 5 }: { current: number; total?: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-2 rounded-full transition-all",
            index <= current ? "w-7 bg-primary shadow-[0_8px_18px_-10px_rgba(15,138,95,0.9)]" : "w-2 bg-slate-300/80 dark:bg-white/20"
          )}
        />
      ))}
    </div>
  );
}
