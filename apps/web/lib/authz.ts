import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export const staffRoles = ["ADMIN", "STAFF", "OWNER", "MANAGER", "PACKING_STAFF"] as const;
export const ownerRoles = ["ADMIN", "OWNER"] as const;
export const deliveryRoles = ["DELIVERY_PARTNER"] as const;

export type StaffRole = (typeof staffRoles)[number];

export function isStaffRole(role?: string | null): role is StaffRole {
  return staffRoles.includes(role as StaffRole);
}

export function isOwnerRole(role?: string | null) {
  return ownerRoles.includes(role as (typeof ownerRoles)[number]);
}

/**
 * @deprecated Migrate to `hasPermission(ctx, 'orders.manage')` from `@/lib/permissions`.
 * This function exists for backward compatibility during migration.
 * @see {@link file://@/lib/require-permission.ts}
 */
export function canManageOrders(role?: string | null) {
  return isOwnerRole(role) || role === "MANAGER" || role === "STAFF";
}

/**
 * @deprecated Migrate to `hasPermission(ctx, 'orders.manage')` from `@/lib/permissions`.
 * This function exists for backward compatibility during migration.
 * @see {@link file://@/lib/require-permission.ts}
 */
export function canPackOrders(role?: string | null) {
  return canManageOrders(role) || role === "PACKING_STAFF";
}

/**
 * @deprecated Migrate to `hasPermission(ctx, 'settings.manage')` from `@/lib/permissions`.
 * This function exists for backward compatibility during migration.
 * @see {@link file://@/lib/require-permission.ts}
 */
export function canManageSettings(role?: string | null) {
  return isOwnerRole(role);
}

/**
 * @deprecated Migrate to `hasPermission(ctx, 'catalogue.manage')` from `@/lib/permissions`.
 * This function exists for backward compatibility during migration.
 * @see {@link file://@/lib/require-permission.ts}
 */
export function canManageProducts(role?: string | null) {
  return isOwnerRole(role) || role === "MANAGER" || role === "STAFF";
}

/**
 * @deprecated Migrate to `hasPermission(ctx, 'reports.view')` from `@/lib/permissions`.
 * This function exists for backward compatibility during migration.
 * @see {@link file://@/lib/require-permission.ts}
 */
export function canViewReports(role?: string | null) {
  return isOwnerRole(role) || role === "MANAGER";
}

/**
 * @deprecated Migrate to `hasPermission(ctx, 'staff.manage')` from `@/lib/permissions`.
 * This function exists for backward compatibility during migration.
 * @see {@link file://@/lib/require-permission.ts}
 */
export function canManageStaff(role?: string | null) {
  return isOwnerRole(role);
}

/**
 * @deprecated Migrate to `hasPermission(ctx, 'returns.manage')` from `@/lib/permissions`.
 * This function exists for backward compatibility during migration.
 * @see {@link file://@/lib/require-permission.ts}
 */
export function canManageReturns(role?: string | null) {
  return isOwnerRole(role) || role === "MANAGER";
}

export function isDeliveryRole(role?: string | null) {
  return deliveryRoles.includes(role as (typeof deliveryRoles)[number]);
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * @deprecated Migrate to `requirePermission('orders.manage')` from `@/lib/require-permission`.
 * This function exists for backward compatibility during migration.
 */
export function requireOrderStaff(session: Session | null) {
  if (!isOwnerRole(session?.user?.role) && !session?.user?.permissions?.includes("orders.manage")) return unauthorized();
  return null;
}

/**
 * @deprecated Migrate to `requirePermission('orders.manage')` from `@/lib/require-permission`.
 * This function exists for backward compatibility during migration.
 */
export function requirePackingStaff(session: Session | null) {
  if (!isOwnerRole(session?.user?.role) && session?.user?.role !== "PACKING_STAFF" && !session?.user?.permissions?.includes("orders.manage")) return unauthorized();
  return null;
}

/**
 * @deprecated Migrate to `requirePermission('staff.manage')` or `requirePermission('settings.manage')` from `@/lib/require-permission`.
 * This function exists for backward compatibility during migration.
 */
export function requireOwner(session: Session | null) {
  if (!canManageStaff(session?.user?.role)) return unauthorized();
  return null;
}

/**
 * @deprecated Migrate to `requirePermission('returns.view')` or `requirePermission('returns.manage')` from `@/lib/require-permission`.
 * This function exists for backward compatibility during migration.
 */
export function requireReturnStaff(session: Session | null) {
  if (!isOwnerRole(session?.user?.role) && !session?.user?.permissions?.some((permission) => permission === "returns.view" || permission === "returns.manage")) return unauthorized();
  return null;
}

/**
 * @deprecated Migrate to `requirePermission('catalogue.manage')` from `@/lib/require-permission`.
 * This function exists for backward compatibility during migration.
 */
export function requireProductStaff(session: Session | null) {
  if (!isOwnerRole(session?.user?.role) && !session?.user?.permissions?.includes("catalogue.manage")) return unauthorized();
  return null;
}

/**
 * @deprecated Migrate to `requirePermission('reports.view')` from `@/lib/require-permission`.
 * This function exists for backward compatibility during migration.
 */
export function requireReportStaff(session: Session | null) {
  if (!isOwnerRole(session?.user?.role) && !session?.user?.permissions?.includes("reports.view")) return unauthorized();
  return null;
}
