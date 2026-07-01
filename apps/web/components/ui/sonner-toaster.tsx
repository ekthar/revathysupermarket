"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";

/**
 * Sonner Toaster — app-wide toast design.
 *
 * Design language:
 * - Clean neutral card (white / slate-900) with a bold colored LEFT accent
 *   bar per tone, so success/error/info/warning read instantly without the
 *   whole toast being a loud solid color.
 * - Consistent lucide icons matched to each tone.
 * - Blurred, elevated surface with a rounded-2xl radius to match the app.
 * - Top-center placement (below the notch) so toasts never collide with the
 *   bottom nav or the delivery collection sheet.
 *
 * Usage (anywhere):
 * ```tsx
 * import { toast } from "sonner";
 * toast.success("Payment collected");
 * toast.error("Something went wrong");
 * ```
 * Legacy `useToast().showToast("msg", "success")` continues to work.
 */
export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      position="top-center"
      offset="calc(env(safe-area-inset-top, 0px) + 0.75rem)"
      gap={10}
      duration={3200}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group !w-full flex items-center gap-3 !rounded-2xl !border !border-slate-200 !bg-white/95 !p-4 pr-10 !text-slate-900 !shadow-2xl !backdrop-blur-md dark:!border-slate-700 dark:!bg-slate-900/95 dark:!text-white",
          title: "!text-sm !font-bold !leading-snug",
          description: "!text-xs !text-slate-500 dark:!text-slate-400",
          icon: "!m-0 shrink-0",
          success: "!border-l-4 !border-l-emerald-500",
          error: "!border-l-4 !border-l-red-500",
          info: "!border-l-4 !border-l-blue-500",
          warning: "!border-l-4 !border-l-amber-500",
          closeButton:
            "!left-auto !right-2 !top-1/2 !-translate-y-1/2 !h-6 !w-6 !rounded-full !border-slate-200 !bg-white !text-slate-500 hover:!text-slate-900 dark:!border-slate-700 dark:!bg-slate-800 dark:!text-slate-400 dark:hover:!text-white",
        },
      }}
      closeButton
    />
  );
}
