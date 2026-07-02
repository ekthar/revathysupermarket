"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { toast as sonnerToast } from "sonner";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast Provider — Custom frosted-glass overlay renderer built on top of Sonner.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    const Icon = tone === "success" 
      ? CheckCircle2 
      : tone === "error" 
      ? AlertCircle 
      : Info;

    const iconColor = tone === "success" 
      ? "text-emerald-500 dark:text-emerald-400" 
      : tone === "error" 
      ? "text-rose-500 dark:text-rose-400" 
      : "text-primary dark:text-white";

    const borderColor = tone === "success"
      ? "border-emerald-500/20"
      : tone === "error"
      ? "border-rose-500/20"
      : "border-neutral-200/50 dark:border-neutral-800/40";

    sonnerToast.custom((t) => (
      <div 
        className={`flex items-center gap-3 rounded-2xl bg-white/75 dark:bg-neutral-950/75 border ${borderColor} backdrop-blur-lg px-4 py-3 text-xs font-semibold shadow-lg text-neutral-900 dark:text-neutral-50 min-w-[280px] max-w-sm cursor-pointer hover:bg-white/80 dark:hover:bg-neutral-950/80 transition-all`}
        onClick={() => sonnerToast.dismiss(t)}
      >
        <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
        <span className="flex-1 min-w-0 break-words leading-relaxed">{message}</span>
      </div>
    ));
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
