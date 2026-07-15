"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function AdminDarkModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    >
      {/* Sun shows in dark mode (click to go light) */}
      <Sun className="h-[18px] w-[18px] scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
      {/* Moon shows in light mode (click to go dark) */}
      <Moon className="absolute h-[18px] w-[18px] scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
    </button>
  );
}
