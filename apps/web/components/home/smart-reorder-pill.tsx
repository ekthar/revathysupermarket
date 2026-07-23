"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ShoppingCart, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { springs, tapScale } from "@/lib/motion";
import { useCartActions } from "@/components/cart/cart-provider";
import { haptic } from "@/lib/haptics";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

type FrequentItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  unit: string;
  category: string;
  frequency: number;
  avgQuantity: number;
};

/**
 * SmartReorderPill — "Your Usual" one-tap reorder for returning users.
 *
 * Shown on the homepage when:
 * - User is logged in
 * - User has 3+ frequently ordered items (ordered 2+ times in 60 days)
 *
 * One tap adds all frequent items to cart with their average quantities.
 * This is the Swiggy "Reorder" pattern — fastest path to checkout for
 * repeat customers.
 *
 * Positioned as a floating pill above the bottom nav on the homepage.
 * Dismissible (hidden for the session if X is tapped).
 */
export function SmartReorderPill() {
  const { data: session } = useSession();
  const { addItems } = useCartActions();
  const [items, setItems] = useState<FrequentItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [added, setAdded] = useState(false);

  // Fetch frequent items for logged-in users
  useEffect(() => {
    if (!session?.user?.id) return;

    // Check session dismiss
    if (sessionStorage.getItem("msm-reorder-dismissed")) {
      setDismissed(true);
      return;
    }

    const fetchItems = async () => {
      try {
        const res = await fetch("/api/orders/frequent-items");
        if (!res.ok) return;
        const data = await res.json();
        if (data.hasUsual && data.items.length >= 3) {
          setItems(data.items);
          setVisible(true);
        }
      } catch {
        // Silent failure — feature is optional
      }
    };

    // Delay fetch to not compete with critical homepage data
    const timer = setTimeout(fetchItems, 3000);
    return () => clearTimeout(timer);
  }, [session?.user?.id]);

  const handleReorder = useCallback(async () => {
    if (loading || items.length === 0) return;
    setLoading(true);
    haptic("medium");

    try {
      // Convert frequent items to cart products with average quantities
      const products: Array<Product & { quantity: number }> = items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        image: item.image,
        price: item.price,
        discountPrice: item.discountPrice ?? undefined,
        stock: item.stock,
        unit: item.unit,
        category: item.category as Product["category"],
        popularity: 0,
        description: "",
        quantity: item.avgQuantity,
      }));

      addItems(products);
      setAdded(true);
      haptic("light");

      // Hide after 2s
      setTimeout(() => setVisible(false), 2000);
    } catch {
      // Fallback — shouldn't fail since it's local
    } finally {
      setLoading(false);
    }
  }, [items, loading, addItems]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem("msm-reorder-dismissed", "1");
  }, []);

  if (dismissed || !visible) return null;

  const totalEstimate = items.reduce(
    (sum, item) => sum + (item.discountPrice ?? item.price) * item.avgQuantity,
    0
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={springs.enter}
          className="fixed bottom-[calc(var(--mobile-nav-height,82px)+4.5rem+var(--safe-bottom,0px))] inset-x-4 z-40 md:bottom-6 md:left-auto md:right-6 md:max-w-xs"
        >
          <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-900/10 dark:shadow-neutral-900/50 border border-neutral-100 dark:border-neutral-800 p-3 relative overflow-hidden">
            {/* Dismiss */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-600 z-10"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Content */}
            <div className="flex items-center gap-3">
              {/* Item preview thumbnails */}
              <div className="flex -space-x-2 shrink-0">
                {items.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.id}
                    className="h-9 w-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 border-2 border-white dark:border-neutral-900 overflow-hidden"
                    style={{ zIndex: 3 - idx }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="h-9 w-9 rounded-lg bg-neutral-200 dark:bg-neutral-700 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                    +{items.length - 3}
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pr-5">
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  {added ? "Added to cart!" : "Your usual"}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {added
                    ? `${items.length} items · ${formatCurrency(totalEstimate)}`
                    : `${items.length} items · ~${formatCurrency(totalEstimate)}`
                  }
                </p>
              </div>

              {/* CTA */}
              {!added && (
                <motion.button
                  type="button"
                  onClick={handleReorder}
                  disabled={loading}
                  whileTap={tapScale.subtle}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-neutral-900 dark:bg-white px-3.5 text-[11px] font-bold text-white dark:text-neutral-900 shrink-0 disabled:opacity-50 press"
                >
                  {loading ? (
                    <RotateCcw className="h-3 w-3 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-3 w-3" />
                  )}
                  {loading ? "Adding" : "Add all"}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
