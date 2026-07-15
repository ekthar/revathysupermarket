"use client";

import { ShieldX } from "lucide-react";
import Link from "next/link";

interface AdminAccessDeniedProps {
  /** The permission that is required (for display) */
  permission?: string;
  /** Custom message override */
  message?: string;
}

export function AdminAccessDenied({
  permission,
  message,
}: AdminAccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200/50 bg-red-50/50 px-6 py-16 text-center dark:border-red-900/30 dark:bg-red-950/20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <ShieldX className="h-7 w-7 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
        Access Denied
      </h3>
      <p className="mt-1 max-w-sm text-sm text-red-600 dark:text-red-400">
        {message ||
          `You don't have permission to view this page.${
            permission ? ` Required: ${permission}` : ""
          }`}
      </p>
      <div className="mt-5">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
