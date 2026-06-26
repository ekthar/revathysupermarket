import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem, CartValidationResult } from "@msm/shared/types";
import { calculateCartTotals } from "@msm/shared/utils";
import { api } from "../services/api";

// ============================================
// Cart State
// ============================================

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;

  // Computed
  itemCount: () => number;
  totalQuantity: () => number;
  totals: () => ReturnType<typeof calculateCartTotals>;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  validateCart: () => Promise<boolean>;
}

const CART_STORAGE_KEY = "msm_cart";

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  isValidating: false,
  error: null,

  itemCount: () => get().items.length,
  totalQuantity: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totals: () => calculateCartTotals(get().items),

  loadCart: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        set({ items: JSON.parse(stored), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false, error: "Failed to load cart" });
    }
  },

  addItem: async (item: CartItem) => {
    const { items } = get();
    const existing = items.find((i) => i.productId === item.productId);
    let updated: CartItem[];

    if (existing) {
      updated = items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    } else {
      updated = [...items, item];
    }

    set({ items: updated, error: null });
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
  },

  removeItem: async (productId: string) => {
    const updated = get().items.filter((i) => i.productId !== productId);
    set({ items: updated, error: null });
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
  },

  updateQuantity: async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return get().removeItem(productId);
    }
    const updated = get().items.map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    );
    set({ items: updated, error: null });
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
  },

  clearCart: async () => {
    set({ items: [], error: null });
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
  },

  validateCart: async () => {
    set({ isValidating: true });
    try {
      const { data } = await api.post<CartValidationResult>(
        "/cart/validate",
        { items: get().items }
      );
      set({ items: data.items, isValidating: false });
      return data.valid;
    } catch {
      set({ isValidating: false, error: "Validation failed" });
      return false;
    }
  },
}));
