"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { toast as sonnerToast } from "sonner";

type ToastTone = "success" | "error" | "info";

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast Provider — Thin wrapper around Sonner for backwards compatibility.
 *
 * Previously this was a custom implementation with framer-motion AnimatePresence.
 * Now delegates to Sonner for:
 * - Better accessibility (auto-announces to screen readers)
 * - Reduced bundle size (no duplicate animation logic)
 * - Consistent positioning with the Sonner Toaster in providers.tsx
 * - Swipe-to-dismiss on mobile
 *
 * Migration: Components using useToast().showToast() continue to work unchanged.
 * New code can also use `import { toast } from "sonner"` directly.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    switch (tone) {
      case "success":
        sonnerToast.success(message);
        break;
      case "error":
        sonnerToast.error(message);
        break;
      default:
        sonnerToast(message);
    }
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
