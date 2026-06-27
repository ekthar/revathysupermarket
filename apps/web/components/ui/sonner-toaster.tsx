"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

/**
 * Sonner Toaster — drop-in replacement for the custom ToastProvider.
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
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "rounded-2xl font-sans text-sm shadow-xl border-0",
          success: "bg-emerald-600 text-white",
          error: "bg-red-600 text-white",
          info: "bg-slate-900 text-white dark:bg-white dark:text-slate-900",
        },
        duration: 2800,
      }}
      offset="calc(var(--mobile-nav-height, 80px) + var(--safe-bottom, 0px) + 0.5rem)"
      richColors
      closeButton
    />
  );
}
