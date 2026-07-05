"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { forwardRef, memo, useCallback, useImperativeHandle, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useToggleFavorite } from "@/lib/queries/favorites";

interface FavoriteButtonProps {
  productId: string;
  initialFavorited?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export type FavoriteButtonHandle = {
  toggle: () => void;
};

// Memoized to prevent re-renders when parent ProductCard re-renders
export const FavoriteButton = memo(forwardRef<FavoriteButtonHandle, FavoriteButtonProps>(function FavoriteButton({ productId, initialFavorited = false, className, size = "sm" }, ref) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const toggleFavoriteMutation = useToggleFavorite();

  const toggle = useCallback(() => {
    const newState = !isFavorited;
    setIsFavorited(newState);

    // Haptic feedback - non-blocking
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    startTransition(async () => {
      try {
        await toggleFavoriteMutation.mutateAsync({
          productId,
          isFavorited: newState,
        });
      } catch {
        setIsFavorited(!newState);
      }
    });
  }, [isFavorited, productId, toggleFavoriteMutation, startTransition]);

  useImperativeHandle(ref, () => ({ toggle }), [toggle]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  }, [toggle]);

  const sizeClasses = size === "sm"
    ? "h-7 w-7"
    : "h-9 w-9";

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.8 }}
      className={cn(
        "flex items-center justify-center rounded-full transition-all press gpu-accelerated",
        isFavorited
          ? "bg-red-50 dark:bg-red-950/50"
          : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
        sizeClasses,
        className
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {/* Simplified: no AnimatePresence - just CSS transition for icon swap */}
      <Heart
        className={cn(
          iconSize,
          "transition-all duration-200",
          isFavorited
            ? "text-red-500 fill-red-500 scale-110"
            : "text-slate-400 dark:text-slate-500 scale-100"
        )}
      />
    </motion.button>
  );
}));
