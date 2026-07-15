"use client";

import { ReactNode } from "react";
import { AdminBreadcrumbs, type BreadcrumbItem } from "./AdminBreadcrumbs";

interface AdminPageShellProps {
  /** Small uppercase label above the title */
  eyebrow?: string;
  /** Page title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Breadcrumb items (auto-includes "Dashboard" as root) */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons rendered in the header (e.g., Export, Add New) */
  actions?: ReactNode;
  /** Gradient color scheme for the header - defaults to "neutral" */
  variant?: "neutral" | "green" | "blue" | "amber" | "rose";
  /** Page content */
  children: ReactNode;
}

const gradients: Record<string, string> = {
  neutral: "from-neutral-900 via-neutral-800 to-neutral-900",
  green: "from-emerald-900 via-emerald-800 to-green-900",
  blue: "from-blue-900 via-blue-800 to-indigo-900",
  amber: "from-amber-900 via-amber-800 to-orange-900",
  rose: "from-rose-900 via-rose-800 to-pink-900",
};

export function AdminPageShell({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  variant = "neutral",
  children,
}: AdminPageShellProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <AdminBreadcrumbs items={breadcrumbs} />
      )}

      {/* Header */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[variant]} p-6 sm:p-8`}
      >
        {/* Background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-5">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />
        </div>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-2xl font-black text-white sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="max-w-lg text-sm text-white/70">{description}</p>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
