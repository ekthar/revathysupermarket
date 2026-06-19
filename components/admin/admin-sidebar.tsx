"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, ClipboardList, LayoutDashboard, Package, RotateCcw, Settings, ShoppingBag, Users } from "lucide-react";
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
  Settings
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  show: boolean;
  badge: number;
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
        <nav className="sticky top-20 space-y-1">
          {nav.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all relative",
                  active
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-slate-400")} />
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
          })}
        </nav>
      </aside>

      {/* Mobile nav - horizontal scroll with active state */}
      <div className="lg:hidden mb-4 -mx-4 px-4">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {nav.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold transition-all press",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", active ? "text-white" : "text-slate-400")} />
                {item.label}
                {item.badge > 0 && (
                  <span className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold",
                    active ? "bg-white/30 text-white" : "bg-red-500 text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
