"use client";

import Link from "next/link";
import { Home, LayoutDashboard, Search, ShoppingBag, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Shop", icon: Search },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/dashboard", label: "Orders", icon: LayoutDashboard },
  { href: "/login", label: "Account", icon: UserRound }
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <nav className="glass-nav fixed inset-x-3 bottom-3 z-50 rounded-[1.75rem] p-2 md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold text-muted-foreground transition",
                active && "bg-primary text-white shadow-[0_12px_30px_-18px_rgba(15,138,95,0.9)]"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.href === "/cart" && totalItems > 0 && (
                <span className="absolute right-3 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime-fresh px-1 text-[10px] font-black text-slate-950">
                  {totalItems}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
