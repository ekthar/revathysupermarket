"use client";

type StatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "pending";

interface AdminStatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  /** Dot indicator (adds a small colored dot before the label) */
  dot?: boolean;
  /** Small size */
  size?: "sm" | "default";
}

const variantStyles: Record<StatusVariant, string> = {
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  warning:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
  error:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800",
  info: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800",
  neutral:
    "bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
  pending:
    "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-800",
};

const dotStyles: Record<StatusVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-neutral-400",
  pending: "bg-purple-500",
};

/**
 * Maps OrderStatus enum values to badge variants.
 * Use: `<AdminStatusBadge label={status} variant={orderStatusVariant(status)} />`
 */
export function orderStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "DELIVERED":
      return "success";
    case "ORDER_RECEIVED":
    case "AWAITING_CUSTOMER_APPROVAL":
      return "pending";
    case "ACCEPTED":
    case "PACKING":
    case "READY_FOR_DELIVERY":
      return "info";
    case "OUT_FOR_DELIVERY":
    case "ARRIVING":
      return "warning";
    case "CANCELLED":
    case "CUSTOMER_UNAVAILABLE":
    case "RETURNED_TO_STORE":
      return "error";
    default:
      return "neutral";
  }
}

/** Maps OrderStatus to human-readable labels */
export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ORDER_RECEIVED: "Received",
    AWAITING_CUSTOMER_APPROVAL: "Awaiting Approval",
    ACCEPTED: "Accepted",
    PACKING: "Packing",
    READY_FOR_DELIVERY: "Ready",
    OUT_FOR_DELIVERY: "Out for Delivery",
    ARRIVING: "Arriving",
    CUSTOMER_UNAVAILABLE: "Unavailable",
    RETURNED_TO_STORE: "Returned",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status.replace(/_/g, " ").toLowerCase();
}

export function AdminStatusBadge({
  label,
  variant = "neutral",
  dot = true,
  size = "default",
}: AdminStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset font-medium ${
        variantStyles[variant]
      } ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}
