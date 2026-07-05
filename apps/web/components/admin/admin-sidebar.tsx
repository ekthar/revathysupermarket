"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, ClipboardList, CreditCard, Gift, LayoutDashboard, MessageSquare, Package, RotateCcw, Settings, ShieldCheck, ShoppingBag, Tag, Ticket, Truck, Users } from "lucide-react";
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

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Classic desktop top navigation */}
      <nav className="hidden lg:flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-card p-2 shadow-sm">
        {nav.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.group}
              className={cn(
                "relative flex min-h-10 items-center gap-2 rounded-xl px-3 text-caption font-semibold transition-colors",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-micro font-bold text-white">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Mobile nav - grouped collapsible menu with touch-friendly targets */}
      <details className="lg:hidden mb-4 rounded-2xl border border-border bg-card p-2">
        <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-black">Admin menu</summary>
        <div className="flex flex-col gap-2 pt-2">
          {(() => {
            const groups = nav.reduce<Record<string, NavItem[]>>((acc, item) => {
              (acc[item.group] ??= []).push(item);
              return acc;
            }, {});

            const activeGroup = Object.entries(groups).find(([, items]) =>
              items.some((item) => isActive(item.href))
            )?.[0];

            return Object.entries(groups).map(([groupName, items]) => (
              <details
                key={groupName}
                open={groupName === activeGroup || undefined}
                className="rounded-xl border border-border overflow-hidden"
              >
                <summary className="flex min-h-[44px] cursor-pointer items-center justify-between px-3 py-2 font-bold text-sm text-foreground bg-muted">
                  <span>{groupName}</span>
                  <svg className="h-4 w-4 shrink-0 text-muted-foreground transition-transform [[open]>&]:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className="grid grid-cols-1 gap-1 p-1">
                  {items.map((item) => {
                    const Icon = iconMap[item.icon] || LayoutDashboard;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
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
              </details>
            ));
          })()}
        </div>
      </details>
    </>
  );
}
