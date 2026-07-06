"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Bell, ChevronDown, ClipboardList, CreditCard, Gift, LayoutDashboard, Menu, MessageSquare, Package, RotateCcw, Settings, ShieldCheck, ShoppingBag, Tag, Ticket, Truck, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  ShoppingBag,
  Package,
  RotateCcw,
  Users,
  BarChart3,
  Bell,
  ClipboardList,
  Settings,
  Truck,
  MessageSquare,
  Tag,
  Ticket,
  CreditCard,
  ShieldCheck,
  Gift,
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  show: boolean;
  badge: number;
  group: string;
};

export function AdminSidebar({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function toggleGroup(group: string) {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  const groups = nav.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  const activeGroup = Object.entries(groups).find(([, items]) =>
    items.some((item) => isActive(item.href))
  )?.[0];

  return (
    <>
      {/* Desktop top navigation - scrollable single row */}
      <nav className="hidden lg:flex items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-sm scrollbar-none">
        {nav.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.group}
              className={cn(
                "relative flex shrink-0 min-h-10 items-center gap-2 rounded-xl px-3 text-caption font-semibold transition-colors",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
              {item.badge > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-micro font-bold text-white">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Mobile nav - controlled state, closes on navigation */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex w-full min-h-11 items-center justify-between rounded-2xl border border-border bg-card px-4 text-sm font-black"
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-nav"
        >
          <span className="flex items-center gap-2"><Menu className="h-4 w-4" />Admin menu</span>
          {mobileOpen ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {mobileOpen && (
          <div id="admin-mobile-nav" className="mt-1 flex flex-col gap-2 rounded-2xl border border-border bg-card p-2">
            {Object.entries(groups).map(([groupName, items]) => {
              const isGroupOpen = openGroups[groupName] ?? groupName === activeGroup;
              return (
                <div key={groupName} className="rounded-xl border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupName)}
                    className="flex w-full min-h-[44px] items-center justify-between px-3 py-2 font-bold text-sm text-foreground bg-muted"
                    aria-expanded={isGroupOpen}
                  >
                    <span>{groupName}</span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isGroupOpen && "rotate-180")} />
                  </button>
                  {isGroupOpen && (
                    <div className="grid grid-cols-1 gap-1 p-1">
                      {items.map((item) => {
                        const Icon = iconMap[item.icon] || LayoutDashboard;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-xl text-caption font-semibold transition-all press min-h-[44px]",
                              active
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "bg-card border border-border text-muted-foreground"
                            )}
                          >
                            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-muted-foreground")} />
                            <span className="truncate">{item.label}</span>
                            {item.badge > 0 && (
                              <span className={cn(
                                "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-micro font-bold",
                                active ? "bg-white/25 text-white" : "bg-red-500 text-white"
                              )}>
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
          </div>
        )}
      </div>
    </>
  );
}
