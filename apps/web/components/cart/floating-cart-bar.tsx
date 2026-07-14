"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { springs, tapScale } from "@/lib/motion";
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
  "/products/",
];

/**
 * Premium floating cart summary bar -- mobile only.
 * Positioned above the bottom navigation with a clear gap.
 * Hidden on cart/checkout/admin routes and when the cart is empty.
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
          <motion.div whileTap={tapScale.primary} transition={springs.tap}>
            <Link
              href="/cart"
              data-cart-icon
              onClick={() => haptic("light")}
              className="floating-cart-bar"
              aria-label={`View cart, ${totalItems} item${totalItems === 1 ? "" : "s"}, subtotal ${formatCurrency(subtotal)}`}
            >
              {/* Leading: green-tinted circular icon */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 dark:bg-emerald-500/15">
                  <ShoppingBag className="h-4 w-4 text-emerald-400" />
                </span>

                {/* Center: item count + product summary */}
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight text-white">
                    {totalItems} item{totalItems === 1 ? "" : "s"}
                  </p>
                  <p className="text-[11px] font-medium text-white/70 truncate max-w-[140px]">
                    {items.slice(0, 2).map((i) => i.name).join(", ")}
                    {items.length > 2 ? ` +${items.length - 2}` : ""}
                  </p>
                </div>
              </div>

              {/* Trailing: subtotal + chevron */}
              <div className="flex items-center gap-1 shrink-0 pl-2">
                <span className="text-sm font-black text-white tabular-nums">
                  {formatCurrency(subtotal)}
                </span>
                <ChevronRight className="h-4 w-4 text-white/80" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
