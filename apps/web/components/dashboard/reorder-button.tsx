"use client";

import { useState } from "react";
import { RotateCcw, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useCartActions } from "@/components/cart/cart-provider";
import { useToast } from "@/components/toast-provider";
import type { Product } from "@/lib/types";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  product?: Product | null;
};

interface ReorderButtonProps {
  orderId: string;
  items: OrderItem[];
  className?: string;
}

export function ReorderButton({ orderId, items, className }: ReorderButtonProps) {
  const { addItems } = useCartActions();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function handleReorder() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/orders/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        // Fallback: use local product data if API fails
        const products = items
          .filter((item) => item.product && item.product.stock > 0)
          .map((item) => ({ ...item.product!, quantity: item.quantity }));

        if (products.length === 0) {
          showToast("Products from this order are no longer available", "error");
          setIsLoading(false);
          return;
        }

        addItems(products);
        showToast(`${products.length} item${products.length > 1 ? "s" : ""} added to cart`, "success");
        setIsLoading(false);
        return;
      }

      const data = await response.json() as {
        available: Array<Product & { quantity: number }>;
        unavailable: string[];
      };

      if (data.available.length === 0) {
        showToast("All items from this order are currently out of stock", "error");
        setIsLoading(false);
        return;
      }

      addItems(data.available);

      if (data.unavailable.length > 0) {
        showToast(
          `Added ${data.available.length} item${data.available.length > 1 ? "s" : ""}. Skipped: ${data.unavailable.join(", ")} (out of stock)`,
          "info"
        );
      } else {
        showToast(`All ${data.available.length} item${data.available.length > 1 ? "s" : ""} added to cart`, "success");
      }
    } catch {
      // Fallback to local data
      const products = items
        .filter((item) => item.product && item.product.stock > 0)
        .map((item) => ({ ...item.product!, quantity: item.quantity }));

      if (products.length > 0) {
        addItems(products);
        showToast(`${products.length} item${products.length > 1 ? "s" : ""} added to cart`, "success");
      } else {
        showToast("Could not reorder items", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleReorder}
      disabled={isLoading}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.02 }}
      className={`flex items-center justify-center gap-1.5 rounded-xl bg-black text-caption font-bold text-white disabled:opacity-50 ${className ?? "h-9 flex-1"}`}
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </motion.div>
      ) : (
        <ShoppingCart className="h-3.5 w-3.5" />
      )}
      {isLoading ? "Adding..." : "Reorder"}
    </motion.button>
  );
}
