"use client";

import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
  initialFavorited?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ productId, initialFavorited = false, className, size = "sm" }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const newState = !isFavorited;
    setIsFavorited(newState);

    // Haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    startTransition(async () => {
      try {
        if (newState) {
          const res = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId })
          });
          if (!res.ok) setIsFavorited(false);
        } else {
          const res = await fetch(`/api/favorites/${productId}`, { method: "DELETE" });
          if (!res.ok) setIsFavorited(true);
        }
      } catch {
        setIsFavorited(!newState);
      }
    });
  }

  const sizeClasses = size === "sm"
    ? "h-7 w-7"
    : "h-9 w-9";

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";

  return (
    <motion.button
      type="button"
      onClick={toggleFavorite}
      whileTap={{ scale: 0.8 }}
      className={cn(
        "flex items-center justify-center rounded-full transition-all press",
        isFavorited
          ? "bg-red-50 dark:bg-red-950/50"
          : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
        sizeClasses,
        className
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorited ? "filled" : "empty"}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 45 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <Heart
            className={cn(
              iconSize,
              isFavorited
                ? "text-red-500 fill-red-500"
                : "text-slate-400 dark:text-slate-500"
            )}
          />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
