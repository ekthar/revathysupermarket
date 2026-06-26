"use client";

import { cn } from "@/lib/utils";

export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin", className)} />
  );
}
