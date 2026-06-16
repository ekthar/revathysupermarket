"use client";

import Link from "next/link";
import { MapPin, ShoppingBag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/components/cart/cart-provider";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/dashboard", label: "My Orders" },
  { href: "/admin", label: "Admin" }
];

export function Header() {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-background/80 backdrop-blur-2xl dark:border-white/10">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[1.35rem] bg-primary text-lg font-black text-white shadow-[0_16px_30px_-20px_rgba(15,138,95,0.85)]">
            R
          </span>
          <span>
            <span className="block font-display text-lg font-bold leading-none text-slate-900 dark:text-white">
              Revathy
            </span>
            <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              Neyyattinkara
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Button asChild variant="outline" size="icon" title="Account">
            <Link href="/login">
              <UserRound className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="icon" title="Cart" className="relative">
            <Link href="/cart">
              <ShoppingBag className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-fresh px-1 text-[11px] font-black text-slate-950">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
