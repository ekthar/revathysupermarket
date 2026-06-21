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

export function canManageOrders(role?: string | null) {
  return isOwnerRole(role) || role === "MANAGER" || role === "STAFF";
}

export function canPackOrders(role?: string | null) {
  return canManageOrders(role) || role === "PACKING_STAFF";
}

export function canManageSettings(role?: string | null) {
  return isOwnerRole(role);
}

export function canManageProducts(role?: string | null) {
  return isOwnerRole(role) || role === "MANAGER" || role === "STAFF";
}

export function canViewReports(role?: string | null) {
  return isOwnerRole(role) || role === "MANAGER";
}

export function canManageStaff(role?: string | null) {
  return isOwnerRole(role);
}

export function canManageReturns(role?: string | null) {
  return isOwnerRole(role) || role === "MANAGER";
}

export function isDeliveryRole(role?: string | null) {
  return deliveryRoles.includes(role as (typeof deliveryRoles)[number]);
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function requireOrderStaff(session: Session | null) {
  if (!canManageOrders(session?.user?.role)) return unauthorized();
  return null;
}

export function requirePackingStaff(session: Session | null) {
  if (!canPackOrders(session?.user?.role)) return unauthorized();
  return null;
}

export function requireOwner(session: Session | null) {
  if (!canManageStaff(session?.user?.role)) return unauthorized();
  return null;
}

export function requireReturnStaff(session: Session | null) {
  if (!canManageReturns(session?.user?.role)) return unauthorized();
  return null;
}

export function requireProductStaff(session: Session | null) {
  if (!canManageProducts(session?.user?.role)) return unauthorized();
  return null;
}

export function requireReportStaff(session: Session | null) {
  if (!canViewReports(session?.user?.role)) return unauthorized();
  return null;
}
