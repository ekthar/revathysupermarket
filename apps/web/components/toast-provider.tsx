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
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    switch (tone) {
      case "success":
        sonnerToast.success(message, { duration: 4000 });
        break;
      case "error":
        sonnerToast.error(message, { duration: 6000 });
        break;
      default:
        sonnerToast(message, { duration: 4000 });
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
