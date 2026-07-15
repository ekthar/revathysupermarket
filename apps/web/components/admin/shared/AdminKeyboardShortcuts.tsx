"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Registers global keyboard shortcuts for the admin panel.
 * Renders nothing visible — attach at the layout level.
 *
 * Shortcuts:
 *  /       – Focus the first search input on the page (dispatches custom event)
 *  Cmd+K   – Open command palette (handled by AdminCommandPalette itself)
 *  ?       – Show shortcuts help dialog
 *  Esc     – Close any open dialog / help
 */
export function AdminKeyboardShortcuts({ children }: { children: ReactNode }) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Don't intercept if user is typing in an input (except Escape)
      if (e.key === "Escape") {
        setShowHelp(false);
        return;
      }

      if (isInput) return;

      // "/" – Focus search
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("admin:focus-search"));
        // Also try to focus the first search input directly
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="text"][placeholder*="earch"], input[type="search"]'
        );
        searchInput?.focus();
      }

      // "?" – Show shortcuts help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {children}

      {/* Shortcuts help dialog */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center"
          role="dialog"
          aria-label="Keyboard shortcuts"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Keyboard Shortcuts
            </h2>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
              <ShortcutRow keys={["⌘", "K"]} label="Open command palette" />
              <ShortcutRow keys={["/"]} label="Focus search" />
              <ShortcutRow keys={["?"]} label="Show this help" />
              <ShortcutRow keys={["Esc"]} label="Close dialog" />
              <ShortcutRow keys={["↑", "↓"]} label="Navigate items" />
              <ShortcutRow keys={["↵"]} label="Select item" />
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full rounded-lg bg-neutral-100 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className="flex gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="inline-flex min-w-[24px] items-center justify-center rounded border border-neutral-200 px-1.5 py-0.5 text-xs font-medium text-neutral-500 dark:border-neutral-600 dark:text-neutral-400"
          >
            {k}
          </kbd>
        ))}
      </span>
    </li>
  );
}
