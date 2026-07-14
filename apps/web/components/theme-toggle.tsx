"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { springs } from "@/lib/motion";
import { Button } from "@/components/ui/button";

/**
 * Canonical theme-toggle logic. The app runs a strict light/dark scheme
 * (next-themes ThemeProvider is configured with enableSystem={false}), so we
 * read `resolvedTheme` everywhere for a single, consistent source of truth and
 * flip between "light" and "dark" only.
 */
function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");
  return { mounted, isDark, toggle };
}

/** Icon button variant (outline button) for headers/toolbars. */
export function ThemeToggle() {
  const { mounted, isDark, toggle } = useThemeToggle();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      onClick={toggle}
    >
      {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

/** Compact circular icon variant with an animated glyph. */
export function ThemeToggleIcon() {
  const { mounted, isDark, toggle } = useThemeToggle();

  return (
    <button
      onClick={toggle}
      className="relative flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 press transition-colors"
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
    >
      {mounted ? (
        <motion.div
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={springs.enter}
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px] text-yellow-400" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-neutral-600 dark:text-neutral-300" />
          )}
        </motion.div>
      ) : (
        /* Pre-mount placeholder to avoid layout shift and hydration mismatch */
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}

/** Inline switch variant used in the account settings list. */
export function ThemeToggleInline() {
  const { mounted, isDark, toggle } = useThemeToggle();

  if (!mounted) return <div className="h-7 w-12 rounded-full bg-slate-100 dark:bg-slate-800" />;

  return (
    <button
      onClick={toggle}
      className={`relative h-7 w-12 rounded-full transition-colors ${isDark ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}`}
      aria-label="Toggle dark mode"
    >
      <span
        className={`stay-light absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isDark ? "left-6" : "left-1"}`}
      />
    </button>
  );
}
