"use client";

import { Flame } from "lucide-react";

export function OrderStreak({ weekCount }: { weekCount: number }) {
  if (weekCount < 2) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 dark:bg-orange-950/30">
      <Flame className="h-3.5 w-3.5 text-orange-500" />
      <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
        {weekCount} week streak
      </span>
    </div>
  );
}
