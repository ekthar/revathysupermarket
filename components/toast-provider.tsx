"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }].slice(-3));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="safe-toast-stack pointer-events-none fixed inset-x-0 z-[88] mx-auto flex max-w-md flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:mx-0 sm:w-[min(420px,calc(100vw-2rem))] sm:px-0">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = icons[toast.tone];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                className={cn(
                  "glass-panel pointer-events-auto flex items-center gap-3 rounded-2xl p-3 text-sm font-bold",
                  toast.tone === "success" && "border-primary/25 bg-primary/10 text-primary dark:bg-primary/15",
                  toast.tone === "error" && "border-red-300/60 bg-red-50/95 text-red-600 dark:border-red-500/35 dark:bg-red-950/80 dark:text-red-200",
                  toast.tone === "info" && "text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{toast.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
