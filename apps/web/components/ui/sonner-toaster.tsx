"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";

/**
 * App-wide toast — iOS native notification banner style.
 *
 * This intentionally does NOT look like a Material card (no full-width
 * rectangle, no colored left accent bar). It mimics iOS's in-app/lock-screen
 * notification banner:
 * - Compact capsule width (~92vw capped at 380px), centered — not edge-to-edge.
 * - A squircle "app icon" tile on the left (tone-tinted, rounded-xl) instead
 *   of a bare icon glyph.
 * - Heavy vibrancy/blur glass surface (same recipe as the header's
 *   `.ios-glass`), not a flat card with a border.
 * - A spring "drop-and-settle" entrance with slight overshoot, not a linear
 *   ease slide — see the transition override injected below.
 * - Single accent color communicated entirely by the icon tile tint, never
 *   by a colored stripe on the card itself.
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
    <>
      {/* Spring bounce entrance — Sonner's default is a linear-ish 400ms ease.
          There is exactly one Toaster mounted app-wide (see providers.tsx),
          so it's safe to target [data-sonner-toast] globally here: every
          toast in the app gets the "drop and settle" spring instead of a
          flat linear slide, matching a real iOS notification banner. */}
      <style>{`
        [data-sonner-toast] {
          transition: transform 550ms cubic-bezier(0.34, 1.42, 0.4, 1), opacity 280ms ease, height 400ms ease !important;
        }
      `}</style>
      <SonnerToaster
        theme={theme as "light" | "dark" | "system"}
        position="top-center"
        offset="calc(env(safe-area-inset-top, 0px) + 0.625rem)"
        gap={8}
        duration={3200}
        icons={{
          success: <IconTile tone="success"><CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2.25} /></IconTile>,
          error: <IconTile tone="error"><XCircle className="h-[18px] w-[18px]" strokeWidth={2.25} /></IconTile>,
          info: <IconTile tone="info"><Info className="h-[18px] w-[18px]" strokeWidth={2.25} /></IconTile>,
          warning: <IconTile tone="warning"><AlertTriangle className="h-[18px] w-[18px]" strokeWidth={2.25} /></IconTile>,
        }}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "group flex w-[min(92vw,380px)] items-center gap-3 rounded-[20px] border border-white/60 bg-white/85 px-3.5 py-3 shadow-[0_12px_36px_-8px_rgba(0,0,0,0.28)] backdrop-blur-2xl backdrop-saturate-[1.8] dark:border-white/10 dark:bg-slate-900/80",
            // Sonner's base [data-icon] wrapper defaults to a fixed 16x16px
            // box with negative margins (sized for a bare glyph) regardless
            // of `unstyled`. Override to fit our 36px squircle icon tile.
            icon: "!m-0 !h-9 !w-9 shrink-0",
            title: "text-[13.5px] font-semibold leading-snug text-slate-900 dark:text-white",
            description: "mt-0.5 text-[12px] leading-snug text-slate-500 dark:text-slate-400",
            closeButton:
              "!left-auto !right-1.5 !top-1.5 !h-5 !w-5 !translate-x-0 !translate-y-0 !rounded-full !border-0 !bg-slate-900/10 !text-slate-500 hover:!bg-slate-900/20 dark:!bg-white/10 dark:!text-slate-300 dark:hover:!bg-white/20",
          },
        }}
        closeButton
      />
    </>
  );
}

function IconTile({ tone, children }: { tone: "success" | "error" | "info" | "warning"; children: React.ReactNode }) {
  const toneClass = {
    success: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
    error: "bg-red-500/15 text-red-600 dark:bg-red-400/15 dark:text-red-400",
    info: "bg-blue-500/15 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400",
    warning: "bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400",
  }[tone];

  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
      {children}
    </span>
  );
}
