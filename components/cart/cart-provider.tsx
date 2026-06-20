"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  addItems: (products: Array<Product & { quantity?: number }>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "store-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity,
      0
    );

    return {
      items,
      totalItems,
      subtotal,
      addItem(product, quantity = 1) {
        setItems((current) => {
          const existing = current.find((item) => item.id === product.id);
          if (existing) {
            return current.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
            );
          }
          return [...current, { ...product, quantity }];
        });
      },
      addItems(productsToAdd) {
        setItems((current) => {
          const next = [...current];
          for (const product of productsToAdd) {
            const quantity = product.quantity ?? 1;
            const existingIndex = next.findIndex((item) => item.id === product.id);
            if (existingIndex >= 0) {
              next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity };
            } else {
              next.push({ ...product, quantity });
            }
          }
          return next;
        });
      },
      removeItem(id) {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      updateQuantity(id, quantity) {
        if (quantity <= 0) {
          setItems((current) => current.filter((item) => item.id !== id));
          return;
        }
        setItems((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)));
      },
      clearCart() {
        setItems([]);
      }
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
