import { useMutation, useQueryClient } from "@tanstack/react-query";

export const FAVORITES_QUERY_KEY = ["favorites"] as const;

type ToggleFavoriteVars = {
  productId: string;
  isFavorited: boolean;
};

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isFavorited }: ToggleFavoriteVars) => {
      if (isFavorited) {
        // Adding to favorites
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) throw new Error("Failed to add favorite");
        return { productId, favorited: true };
      } else {
        // Removing from favorites
        const res = await fetch(`/api/favorites/${productId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove favorite");
        return { productId, favorited: false };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });
}
