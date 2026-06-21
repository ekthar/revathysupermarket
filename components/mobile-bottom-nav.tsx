"use client";

import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import type { SessionIdentity } from "@/components/session-identity-card";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ user }: { user: SessionIdentity }) {
  const pathname = usePathname();
  const { totalItems } = useCart();

  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin")) return null;

  const isCartFlow = pathname.startsWith("/cart") || pathname.startsWith("/checkout");

  return (
    <>
      <nav className="ios-bottom-bar md:hidden" data-disable-edge-swipe="true">
        <div className="ios-glass mx-auto w-full max-w-[24rem] rounded-[1.85rem] p-2 shadow-[0_24px_65px_-30px_rgba(15,23,42,0.55)]">
          <div className="grid min-h-[clamp(52px,8vh,58px)] grid-cols-4 items-center gap-1">
            <NavTab href="/" icon={Home} label="Home" active={pathname === "/"} />
            <NavTab href="/products" icon={Search} label="Browse" active={pathname.startsWith("/products")} />
            <NavTab href="/cart" icon={ShoppingBag} label="Cart" active={isCartFlow} badge={totalItems} />
            <NavTab
              href={user?.id ? "/account" : "/login"}
              icon={User}
              label={user?.id ? "You" : "Login"}
              active={pathname.startsWith("/account") || pathname === "/login" || pathname.startsWith("/dashboard")}
            />
          </div>
        </div>
      </nav>
    </>
  );
}

function NavTab({ href, icon: Icon, label, active, badge }: { href: string; icon: React.ElementType; label: string; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex min-w-0 flex-col items-center justify-center gap-[2px] rounded-2xl px-1 py-2 text-[10px] transition active:scale-[0.97]",
        active ? "bg-black text-white shadow-[0_12px_22px_-14px_rgba(0,0,0,0.75)]" : "text-slate-500 hover:bg-white/65"
      )}
    >
      <motion.div whileTap={{ scale: 0.8 }}>
        <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.2 : 1.8} />
      </motion.div>
      {badge ? (
        <motion.span
          key={badge}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-black text-white"
        >
          {badge}
        </motion.span>
      ) : null}
      <span className={cn("max-w-full truncate leading-none", active ? "font-black" : "font-semibold")}>
        {label}
      </span>
    </Link>
  );
}
