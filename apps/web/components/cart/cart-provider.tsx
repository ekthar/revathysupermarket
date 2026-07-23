"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { toast as sonnerToast } from "sonner";
import type { CartItem, Product } from "@/lib/types";
import { cartSyncQueue } from "@/lib/cart-sync";

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

/** Joins product names into a natural list: "A", "A and B", "A, B and C". */
function listNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// Cart state is optimistic by design - updates are instant in React state,
// persisted to localStorage synchronously. No server-side sync required.

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const listenersRef = useRef<Set<() => void>>(new Set());
  const itemsRef = useRef<CartItem[]>(items);

  // Keep ref in sync
  itemsRef.current = items;

  // Debounce timer for localStorage writes (D4)
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
    // Debounce localStorage writes: only persist after 500ms of no changes
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }, 500);
    // Notify granular subscribers immediately (UI stays responsive)
    listenersRef.current.forEach((listener) => listener());
    return () => { if (persistTimerRef.current) clearTimeout(persistTimerRef.current); };
  }, [hydrated, items]);

  // Reconcile the cart against current server stock/price once after hydration.
  // The cart is a client-side snapshot, so items can go out of stock or change
  // price after they were added. We drop sold-out/removed items, clamp
  // quantities to what's available, refresh prices, and apologise for any change.
  useEffect(() => {
    if (!hydrated) return;
    const snapshot = itemsRef.current;
    if (snapshot.length === 0) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: snapshot.map((item) => item.id) }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          items: Array<{ id: string; name: string; stock: number; price: number; discountPrice: number | null; isActive: boolean }>;
        };
        if (cancelled) return;

        const fresh = new Map(data.items.map((p) => [p.id, p]));
        const removed: string[] = [];
        const reduced: string[] = [];

        setItems((current) => {
          const next: CartItem[] = [];
          for (const item of current) {
            const server = fresh.get(item.id);
            // Missing, deactivated, or fully out of stock → drop it.
            if (!server || !server.isActive || server.stock <= 0) {
              removed.push(item.name);
              continue;
            }
            let quantity = item.quantity;
            if (quantity > server.stock) {
              quantity = server.stock;
              reduced.push(item.name);
            }
            next.push({
              ...item,
              quantity,
              stock: server.stock,
              price: server.price,
              discountPrice: server.discountPrice ?? undefined,
            });
          }
          return next;
        });

        if (removed.length > 0 || reduced.length > 0) {
          const parts: string[] = [];
          if (removed.length > 0) {
            parts.push(`${listNames(removed)} ${removed.length > 1 ? "are" : "is"} now out of stock and ${removed.length > 1 ? "were" : "was"} removed`);
          }
          if (reduced.length > 0) {
            parts.push(`we reduced the quantity of ${listNames(reduced)} to what's in stock`);
          }
          sonnerToast(`Sorry about that — ${parts.join(", and ")}.`);
        }
      } catch {
        // Network/parse failure: leave the cart as-is; checkout re-validates server-side.
      }
    })();

    return () => { cancelled = true; };
    // Runs once per fresh hydration; intentionally not keyed on `items`.
  }, [hydrated]);

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
    // Never add a sold-out product to the cart.
    const max = product.stock ?? 0;
    if (max <= 0) return;
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        // Refresh the stored stock/price ceiling and clamp to available stock.
        return current.map((item) =>
          item.id === product.id
            ? { ...item, stock: max, price: product.price, discountPrice: product.discountPrice, quantity: Math.min(item.quantity + quantity, max) }
            : item
        );
      }
      return [...current, { ...product, quantity: Math.min(quantity, max) }];
    });
    // Background sync
    cartSyncQueue.push({ type: "add", productId: product.id, quantity });
  }, []);

  const addItems = useCallback((productsToAdd: Array<Product & { quantity?: number }>) => {
    setItems((current) => {
      const next = [...current];
      for (const product of productsToAdd) {
        const max = product.stock ?? 0;
        if (max <= 0) continue; // skip sold-out items (e.g. during reorder)
        const quantity = product.quantity ?? 1;
        const existingIndex = next.findIndex((item) => item.id === product.id);
        if (existingIndex >= 0) {
          next[existingIndex] = { ...next[existingIndex], stock: max, quantity: Math.min(next[existingIndex].quantity + quantity, max) };
        } else {
          next.push({ ...product, quantity: Math.min(quantity, max) });
        }
      }
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    cartSyncQueue.push({ type: "remove", productId: id });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => item.id !== id));
      cartSyncQueue.push({ type: "remove", productId: id });
      return;
    }
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item;
      // Clamp to the last-known available stock so a shopper can't exceed it.
      const max = item.stock ?? Infinity;
      return { ...item, quantity: Math.min(quantity, max) };
    }));
    cartSyncQueue.push({ type: "update", productId: id, quantity });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    cartSyncQueue.push({ type: "clear" });
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

  // E5: Server renders empty cart. Client hydrates from localStorage.
  // This is intentional — the brief empty→filled flash is handled by
  // AnimatePresence in cart-page-client.tsx and FloatingCartBar.
  return (
    <CartStoreContext.Provider value={store}>
      <CartActionsContext.Provider value={actions}>
        <CartStateContext.Provider value={state}>
          <div suppressHydrationWarning>
            {children}
          </div>
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
