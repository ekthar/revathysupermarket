"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, ClipboardList, CreditCard, Gift, LayoutDashboard, Megaphone, MessageSquare, Package, RotateCcw, Settings, ShieldCheck, ShoppingBag, Tag, Ticket, Truck, Users } from "lucide-react";
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
  Megaphone,
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
      <nav className="hidden lg:flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-micro font-bold text-white">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Mobile nav - larger touch targets, better dark mode */}
      <details className="lg:hidden mb-4 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
        <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-black">Admin menu</summary>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {nav.map((item) => {
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
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                <span className="whitespace-nowrap">{item.label}</span>
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
    </>
  );
}
