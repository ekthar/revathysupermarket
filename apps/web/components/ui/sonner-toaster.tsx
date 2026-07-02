"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset={16}
      gap={8}
      duration={3000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "flex items-center gap-3 rounded-2xl bg-white/75 dark:bg-neutral-950/75 border border-neutral-200/50 dark:border-neutral-800/40 backdrop-blur-lg px-4 py-3 text-xs font-semibold shadow-lg text-neutral-900 dark:text-neutral-50",
        },
      }}
    />
  );
}
