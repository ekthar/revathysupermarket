"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={16}
      gap={8}
      duration={2000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "font-sans flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-xs font-medium text-white shadow-sm",
        },
      }}
    />
  );
}
