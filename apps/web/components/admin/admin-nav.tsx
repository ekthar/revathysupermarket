"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Bell, Calculator, ChevronDown, Clock, FileText, Gift,
  Headphones, IndianRupee, Layers, LayoutDashboard, Menu, MessageCircle,
  MessageSquare, Package, Receipt, RotateCcw, Settings, ShieldCheck,
  ShoppingBag, Star, Tag, Ticket, ToggleLeft, Truck, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/roles";

const iconMap: Record<string, React.ElementType> = {
  BarChart3, Bell, Calculator, Clock, FileText, Gift, Headphones,
  IndianRupee, Layers, LayoutDashboard, MessageCircle, MessageSquare,
  Package, Receipt, RotateCcw, Settings, ShieldCheck, ShoppingBag,
  Star, Tag, Ticket, ToggleLeft, Truck, Users,
};

type NavItem = { href: string; label: string; icon: string; badge: number };
type NavGroups = Record<string, NavItem[]>;

interface AdminNavProps {
  nav: NavGroups;
  storeName: string;
  logoUrl: string | null;
  userName: string;
  role: string;
}

export function AdminNav({ nav, storeName, logoUrl, userName, role }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function toggleGroup(group: string) {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  // Separate SYSTEM group to pin it at bottom
  const mainGroups = Object.entries(nav).filter(([g]) => g !== "SYSTEM");
  const systemGroup = nav["SYSTEM"] || [];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo / Store name */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-neutral-200 px-4 dark:border-neutral-800">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-600">
          {logoUrl ? (
            <Image src={logoUrl} alt={storeName} fill className="object-contain" unoptimized />
          ) : (
            <ShoppingBag className="h-4 w-4 text-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-neutral-900 dark:text-white">{storeName}</p>
          <p className="truncate text-[10px] text-neutral-500">Admin Panel</p>
        </div>
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-none">
        {mainGroups.map(([group, items]) => {
          const isCollapsed = collapsed[group] ?? false;
          const hasActiveItem = items.some((item) => isActive(item.href));

          return (
            <div key={group} className="mb-1">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                <span>{group}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", isCollapsed && "-rotate-90")} />
              </button>

              {/* Items */}
              {!isCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {items.map((item) => {
                    const Icon = iconMap[item.icon] || LayoutDashboard;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400 dark:text-neutral-500")} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* SYSTEM section — pinned bottom */}
      {systemGroup.length > 0 && (
        <div className="shrink-0 border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
          <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            SYSTEM
          </p>
          <div className="space-y-0.5">
            {systemGroup.map((item) => {
              const Icon = iconMap[item.icon] || Settings;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400 dark:text-neutral-500")} />
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* User info */}
      <div className="shrink-0 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-neutral-900 dark:text-white">{userName}</p>
            <p className="truncate text-[10px] text-neutral-500">{roleLabel(role)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 sticky top-0 h-screen border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:block print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg lg:hidden dark:bg-white dark:text-neutral-900 print:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl dark:bg-neutral-900">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
