"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CartItem, Product } from "@/lib/types";

type CartActions = {
  addItem: (product: Product, quantity?: number) => void;
  addItems: (products: Array<Product & { quantity?: number }>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

type CartState = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
};

type CartContextValue = CartState & CartActions;

// Separate contexts to prevent unnecessary re-renders
// Components that only need actions (addItem, etc.) won't re-render when items change
const CartStateContext = createContext<CartState | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);

// For granular per-item subscriptions (ProductCard only re-renders when ITS item changes)
type CartStore = {
  getState: () => CartItem[];
  subscribe: (listener: () => void) => () => void;
};
const CartStoreContext = createContext<CartStore | null>(null);

const CART_STORAGE_KEY = "msm-cart-v1";

// Cart state is optimistic by design - updates are instant in React state,
// persisted to localStorage synchronously. No server-side sync required.

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const listenersRef = useRef<Set<() => void>>(new Set());
  const itemsRef = useRef<CartItem[]>(items);

  // Keep ref in sync
  itemsRef.current = items;

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
    // Notify granular subscribers
    listenersRef.current.forEach((listener) => listener());
  }, [hydrated, items]);

  // Memoized store for granular per-item subscriptions
  const store = useMemo<CartStore>(() => ({
    getState: () => itemsRef.current,
    subscribe: (listener: () => void) => {
      listenersRef.current.add(listener);
      return () => { listenersRef.current.delete(listener); };
    },
  }), []);

  // Stable action references that never change identity
  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...current, { ...product, quantity }];
    });
  }, []);

  const addItems = useCallback((productsToAdd: Array<Product & { quantity?: number }>) => {
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
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => item.id !== id));
      return;
    }
    setItems((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Memoize state separately from actions
  const state = useMemo<CartState>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity,
      0
    );
    return { items, totalItems, subtotal };
  }, [items]);

  // Actions never change identity
  const actions = useMemo<CartActions>(() => ({
    addItem, addItems, removeItem, updateQuantity, clearCart
  }), [addItem, addItems, removeItem, updateQuantity, clearCart]);

  return (
    <CartStoreContext.Provider value={store}>
      <CartActionsContext.Provider value={actions}>
        <CartStateContext.Provider value={state}>
          {children}
        </CartStateContext.Provider>
      </CartActionsContext.Provider>
    </CartStoreContext.Provider>
  );
}

// Full cart hook (backwards compatible) - use when you need everything
export function useCart() {
  const state = useContext(CartStateContext);
  const actions = useContext(CartActionsContext);
  if (!state || !actions) throw new Error("useCart must be used inside CartProvider");
  return { ...state, ...actions };
}

// Actions-only hook - components using this won't re-render when cart items change
export function useCartActions() {
  const actions = useContext(CartActionsContext);
  if (!actions) throw new Error("useCartActions must be used inside CartProvider");
  return actions;
}

// Total items count only - for badges. Only re-renders when count changes.
export function useCartItemCount() {
  const state = useContext(CartStateContext);
  if (!state) throw new Error("useCartItemCount must be used inside CartProvider");
  return state.totalItems;
}

// Granular per-item subscription - only re-renders when THIS specific item changes
export function useCartItem(productId: string): CartItem | undefined {
  const store = useContext(CartStoreContext);
  if (!store) throw new Error("useCartItem must be used inside CartProvider");

  const getSnapshot = useCallback(() => {
    return store.getState().find((item) => item.id === productId);
  }, [store, productId]);

  // Use useSyncExternalStore for optimal subscription
  const item = useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getSnapshot // server snapshot
  );

  return item;
}
