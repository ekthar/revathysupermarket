"use client";

import Link from "next/link";
import { MapPin, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import type { SessionIdentity } from "@/components/session-identity-card";

export function Header({ user }: { user: SessionIdentity }) {
  const pathname = usePathname();
  const { totalItems } = useCart();

  // Hide on onboarding/login/staff pages
  if (pathname === "/login" || pathname === "/welcome" || pathname.startsWith("/staff")) return null;
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Location */}
        <Link href="/" className="flex items-center gap-1.5 min-w-0">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">Neyyattinkara</p>
            <p className="text-[10px] text-slate-400 leading-tight">Kerala, India</p>
          </div>
        </Link>

        {/* Cart */}
        <Link href="/cart" className="relative flex items-center justify-center h-9 w-9">
          <ShoppingBag className="h-5 w-5 text-slate-700" />
          {totalItems > 0 && (
            <motion.span
              key={totalItems}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white"
            >
              {totalItems}
            </motion.span>
          )}
        </Link>
      </div>
    </header>
  );
}
