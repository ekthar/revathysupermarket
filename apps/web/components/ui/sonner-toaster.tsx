"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Sonner Toaster — minimal, non-blocking toast at the bottom of the screen.
 *
 * Usage (anywhere in the app):
 * ```tsx
 * import { toast } from "sonner";
 * toast.success("Added to cart!");
 * toast.error("Something went wrong");
 * toast("Info message");
 * ```
 *
 * Migration from old useToast():
 * - Old: const { showToast } = useToast(); showToast("Message", "success");
 * - New: import { toast } from "sonner"; toast.success("Message");
 */
export function Toaster() {
  return (
    <SonnerToaster
      theme="light"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "!bg-neutral-900 !text-white !text-xs !font-medium !rounded-full !shadow-sm !border-0 !px-4 !py-2 !min-h-0",
          success: "!bg-neutral-900 !text-white",
          error: "!bg-neutral-900 !text-white",
          info: "!bg-neutral-900 !text-white",
        },
        duration: 2000,
      }}
      offset={16}
    />
  );
}
