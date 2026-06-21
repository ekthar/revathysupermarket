"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, ClipboardList, CreditCard, LayoutDashboard, MessageSquare, Package, RotateCcw, Settings, ShieldCheck, ShoppingBag, Tag, Ticket, Truck, Users } from "lucide-react";
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <nav className="sticky top-20 space-y-4">
          {[...new Set(nav.map((item) => item.group))].map((group) => <div key={group}><p className="mb-1 px-3 text-[11px] font-black uppercase tracking-wide text-slate-400">{group}</p><div className="space-y-1">{nav.filter((item) => item.group === group).map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all relative",
                  active
                    ? "bg-primary/10 dark:bg-primary/15 text-primary font-semibold shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:shadow-sm"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-slate-400 dark:text-slate-500")} />
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                )}
              </Link>
            );
          })}</div></div>)}
        </nav>
      </aside>

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
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all press min-h-[44px]",
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                <span className="whitespace-nowrap">{item.label}</span>
                {item.badge > 0 && (
                  <span className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-bold",
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
