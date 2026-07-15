"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Command,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Shield,
  Settings,
  BarChart3,
  Tag,
  Ticket,
} from "lucide-react";

// ─── Static admin routes ────────────────────────────────────────────────────
const PAGES = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Layers },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Staff", href: "/admin/staff", icon: Shield },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Offers", href: "/admin/offers", icon: Tag },
  { label: "Promo Codes", href: "/admin/promo-codes", icon: Ticket },
] as const;

const QUICK_ACTIONS = [
  { label: "Toggle Store Open/Closed", id: "toggle-store" },
  { label: "Refresh Data", id: "refresh-data" },
] as const;

// ─── Component ──────────────────────────────────────────────────────────────
export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Filter results
  const q = query.toLowerCase().trim();
  const filteredPages = PAGES.filter((p) =>
    p.label.toLowerCase().includes(q)
  );
  const filteredActions = QUICK_ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(q)
  );
  const totalItems = filteredPages.length + filteredActions.length;

  // ── Open/close on Cmd+K / Ctrl+K ─────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Small delay to ensure the DOM is rendered
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ── Select item ───────────────────────────────────────────────────────────
  const selectItem = useCallback(
    (index: number) => {
      if (index < filteredPages.length) {
        const page = filteredPages[index];
        router.push(page.href);
      } else {
        const actionIndex = index - filteredPages.length;
        const action = filteredActions[actionIndex];
        if (action?.id === "refresh-data") {
          router.refresh();
        }
        // toggle-store could dispatch a custom event or call an API
        if (action?.id === "toggle-store") {
          window.dispatchEvent(new CustomEvent("admin:toggle-store"));
        }
      }
      setOpen(false);
    },
    [filteredPages, filteredActions, router]
  );

  // ── Keyboard navigation inside the palette ────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % Math.max(totalItems, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + totalItems) % Math.max(totalItems, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectItem(activeIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
    [activeIndex, totalItems, selectItem]
  );

  // Reset active when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  let itemIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-label="Command palette"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette container */}
      <div
        className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <Search className="h-5 w-5 shrink-0 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions..."
            className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none dark:text-neutral-100"
          />
          <kbd className="hidden rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 sm:inline-block dark:border-neutral-600">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
          {/* Pages section */}
          {filteredPages.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Pages
              </p>
              {filteredPages.map((page) => {
                const idx = itemIndex++;
                const Icon = page.icon;
                return (
                  <button
                    key={page.href}
                    data-active={idx === activeIndex}
                    onClick={() => selectItem(idx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      idx === activeIndex
                        ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                        : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{page.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Quick Actions section */}
          {filteredActions.length > 0 && (
            <>
              <p className="mt-2 px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Quick Actions
              </p>
              {filteredActions.map((action) => {
                const idx = itemIndex++;
                return (
                  <button
                    key={action.id}
                    data-active={idx === activeIndex}
                    onClick={() => selectItem(idx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      idx === activeIndex
                        ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                        : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    <Command className="h-4 w-4 shrink-0" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Empty state */}
          {totalItems === 0 && (
            <p className="px-3 py-6 text-center text-sm text-neutral-400">
              No results found for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-neutral-200 px-4 py-2.5 text-[11px] text-neutral-400 dark:border-neutral-700">
          <span className="inline-flex items-center gap-1">
            <Command className="h-3 w-3" />K to open
          </span>
          <span className="inline-flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            <ArrowDown className="h-3 w-3" /> to navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" /> to select
          </span>
        </div>
      </div>
    </div>
  );
}
