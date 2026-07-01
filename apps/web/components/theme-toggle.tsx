"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
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
      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 press transition-colors"
      aria-label="Toggle dark mode"
    >
      <motion.div
        initial={false}
        animate={{ rotate: mounted && isDark ? 180 : 0, scale: mounted && isDark ? 0.8 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Show the target state you'd switch TO, matching ThemeToggle:
            in dark mode show the Sun (switch to light), in light mode the Moon. */}
        {mounted && isDark ? (
          <Sun className="h-4 w-4 text-yellow-400" />
        ) : (
          <Moon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        )}
      </motion.div>
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
