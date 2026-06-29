"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

/**
 * Generic empty state component for list routes.
 * Use when a data list is empty (no results, no orders, etc.)
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}
      role="status"
      aria-label={title}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-title font-bold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-body text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="mt-5 inline-flex items-center min-h-touch px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-body font-bold transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {action.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-5 inline-flex items-center min-h-touch px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-body font-bold transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
