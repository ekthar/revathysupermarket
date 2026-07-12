"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={{ bottom: "5.5rem" }}
      gap={8}
      duration={2500}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "font-sans flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg max-w-[min(92vw,22rem)]",
          actionButton:
            "ml-1 shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/25",
          cancelButton: "ml-1 shrink-0 rounded-full px-2 py-1 text-[11px] font-bold text-white/70",
        },
      }}
    />
  );
}
