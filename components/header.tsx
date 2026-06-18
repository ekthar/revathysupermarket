"use client";

import Link from "next/link";
import { ChevronDown, MapPin, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import type { SessionIdentity } from "@/components/session-identity-card";

export function Header({
  user,
  storeName = "Revathy",
  storeAddress = "Neyyattinkara"
}: {
  user: SessionIdentity;
  storeName?: string;
  storeAddress?: string;
}) {
  const pathname = usePathname();
  const { totalItems } = useCart();

  // Hide on login/welcome/staff/admin
  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin")) return null;

  const shortAddress = storeAddress.split(",")[0]?.trim() || storeAddress;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100/80">
      <div className="flex items-center justify-between px-4 h-[52px] max-w-7xl mx-auto">
        {/* Location */}
        <Link href="/" className="flex items-center gap-2 min-w-0 press">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-0.5">
              <p className="text-[14px] font-semibold text-slate-900 truncate">{shortAddress}</p>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </div>
            <p className="text-[11px] text-slate-400 truncate leading-tight">{storeName}</p>
          </div>
        </Link>

        {/* Cart */}
        <Link href="/cart" className="relative flex items-center justify-center h-10 w-10 rounded-full bg-slate-50 press">
          <ShoppingBag className="h-[18px] w-[18px] text-slate-700" />
          {totalItems > 0 && (
            <motion.span
              key={totalItems}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white px-1"
            >
              {totalItems}
            </motion.span>
          )}
        </Link>
      </div>
    </header>
  );
}
