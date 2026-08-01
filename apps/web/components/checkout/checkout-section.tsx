"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * CheckoutSection — progressive disclosure wrapper for a checkout step.
 *
 * A completed step collapses to a single summary line with an Edit affordance,
 * so the form shrinks as the customer progresses instead of presenting every
 * field at once. This is what makes the step indicator meaningful: steps visibly
 * close behind you.
 */
export function CheckoutSection({
  step,
  title,
  complete,
  summary,
  open,
  onToggle,
  children,
}: {
  step: number;
  title: string;
  complete: boolean;
  /** One-line recap shown while collapsed (e.g. the chosen address). */
  summary?: ReactNode;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
}) {
  const panelId = `checkout-section-${step}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-card shadow-elevation-1 dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* Step chip doubles as the completion indicator */}
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-micro font-bold",
            complete
              ? "bg-secondary-500 text-white"
              : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          )}
        >
          {complete ? <Check className="h-3.5 w-3.5" /> : step}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-neutral-900 dark:text-white">{title}</span>
          {/* Summary is only useful while the panel is closed. */}
          {!open && summary && (
            <span className="mt-0.5 block truncate text-micro font-medium text-neutral-500 dark:text-neutral-400">
              {summary}
            </span>
          )}
        </span>

        {!open && complete ? (
          <span className="flex shrink-0 items-center gap-1 text-micro font-bold text-secondary-600 dark:text-secondary-400">
            <Pencil className="h-3 w-3" />
            Edit
          </span>
        ) : (
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={springs.snappy} className="shrink-0">
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </motion.span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.snappy}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
