"use client";

import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import type { SessionIdentity } from "@/components/session-identity-card";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ user }: { user: SessionIdentity }) {
  const pathname = usePathname();
  const { totalItems } = useCart();

  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin")) return null;

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/products", icon: Search, label: "Browse" },
    { href: "/cart", icon: ShoppingBag, label: "Cart", badge: totalItems },
    { href: user?.id ? "/account" : "/login", icon: User, label: user?.id ? "Account" : "Login" }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-100 md:hidden" style={{ paddingBottom: "var(--safe-bottom)" }}>
      <div className="grid grid-cols-4 h-[52px]">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-[2px] text-[10px] font-medium",
                active ? "text-primary" : "text-slate-400"
              )}
            >
              <span className="relative">
                <tab.icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white px-0.5">
                    {tab.badge}
                  </span>
                ) : null}
              </span>
              <span className={cn("leading-none", active && "font-semibold")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
