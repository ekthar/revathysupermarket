import { create } from "zustand";
import { api } from "../services/api";

interface FavoritesState {
  favoriteIds: Set<string>;
  isLoading: boolean;

  loadFavorites: () => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: new Set(),
  isLoading: false,

  loadFavorites: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/favorites");
      const ids = (data.items || []).map((item: { id?: string; productId?: string }) => item.productId || item.id);
      set({ favoriteIds: new Set(ids), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (productId: string) => {
    const { favoriteIds } = get();
    const isFav = favoriteIds.has(productId);

    // Optimistic update
    const newIds = new Set(favoriteIds);
    if (isFav) {
      newIds.delete(productId);
    } else {
      newIds.add(productId);
    }
    set({ favoriteIds: newIds });

    try {
      if (isFav) {
        await api.delete(`/favorites/${productId}`);
      } else {
        await api.post("/favorites", { productId });
      }
    } catch {
      // Rollback on error
      set({ favoriteIds });
    }
  },

  isFavorite: (productId: string) => get().favoriteIds.has(productId),
}));
