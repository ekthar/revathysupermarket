"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggleInline() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-7 w-12 rounded-full bg-slate-100" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative h-7 w-12 rounded-full transition-colors ${isDark ? "bg-primary" : "bg-slate-200"}`}
      aria-label="Toggle dark mode"
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isDark ? "left-6" : "left-1"}`}
      />
    </button>
  );
}
