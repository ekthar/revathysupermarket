"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { springs } from "@/lib/motion";
import { haptic } from "@/lib/haptics";

const HIDDEN_PREFIXES = [
  "/cart",
  "/checkout",
  "/login",
  "/welcome",
  "/admin",
  "/delivery",
  "/staff",
  "/track",
  "/dashboard",
];

/**
 * Always-visible "View cart" bar on browse surfaces (home, products, offers, account).
 * Hidden on cart/checkout and when the cart is empty.
 */
export function FloatingCartBar() {
  const pathname = usePathname();
  const { items, totalItems, subtotal } = useCart();

  const hidden =
    totalItems === 0 ||
    HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          className="floating-cart-wrapper md:hidden"
          data-hide-on-keyboard="true"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={springs.snappy}
        >
          <Link
            href="/cart"
            data-cart-icon
            onClick={() => haptic("light")}
            className="floating-cart-bar press"
            aria-label={`View cart, ${totalItems} items, ${formatCurrency(subtotal)}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">
                  {totalItems} item{totalItems === 1 ? "" : "s"}
                </p>
                <p className="text-[11px] font-medium text-white/75 truncate">
                  {items.slice(0, 2).map((i) => i.name).join(", ")}
                  {items.length > 2 ? ` +${items.length - 2}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              <span className="text-sm font-black tabular-nums">{formatCurrency(subtotal)}</span>
              <ChevronRight className="h-4 w-4 opacity-80" />
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
