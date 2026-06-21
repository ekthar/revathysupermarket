/**
 * Staff Permissions System
 * 
 * Permission keys follow the pattern: resource.action
 * High-risk permissions require owner-only granting.
 */

// ─── Permission Keys ───────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // Operations
  "orders.view": "View orders",
  "orders.manage": "Manage orders (status, assignment, edits)",
  "requests.view": "View customer requests",
  "requests.manage": "Handle customer requests (approve, reject, assign)",
  "dispatch.view": "View dispatch and delivery tracking",
  "dispatch.manage": "Assign delivery partners, manage dispatch",
  "returns.view": "View returns",
  "returns.manage": "Process returns (approve/reject)",
  "returns.refund": "Issue refunds on returns",

  // Catalogue
  "catalogue.view": "View products and categories",
  "catalogue.manage": "Add/edit/delete products and categories",

  // Customers
  "customers.view": "View customer list and details",
  "customers.manage": "Manage customer accounts",

  // Marketing
  "marketing.view": "View offers, promos, and campaigns",
  "marketing.manage": "Create/edit offers, promos, push notifications",

  // Finance
  "collections.view": "View delivery collections",
  "collections.reconcile": "Reconcile collections and handle discrepancies",
  "reports.view": "View revenue reports and analytics",

  // Administration
  "pricing.manage": "Change delivery fees and pricing slabs",
  "settings.manage": "Manage store settings",
  "staff.manage": "Create/edit staff and assign permissions",
  "audit.view": "View audit log",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

// ─── High-Risk Permissions (Owner-only granting) ────────────────────────────────
export const HIGH_RISK_PERMISSIONS: PermissionKey[] = [
  "returns.refund",
  "collections.reconcile",
  "pricing.manage",
  "settings.manage",
  "staff.manage",
  "audit.view",
];

// ─── Permission Groups (for UI display) ─────────────────────────────────────────
export const PERMISSION_GROUPS = {
  Operations: ["orders.view", "orders.manage", "requests.view", "requests.manage", "dispatch.view", "dispatch.manage", "returns.view", "returns.manage", "returns.refund"],
  Catalogue: ["catalogue.view", "catalogue.manage"],
  Customers: ["customers.view", "customers.manage"],
  Marketing: ["marketing.view", "marketing.manage"],
  Finance: ["collections.view", "collections.reconcile", "reports.view"],
  Administration: ["pricing.manage", "settings.manage", "staff.manage", "audit.view"],
} as const;

// ─── Role Presets ───────────────────────────────────────────────────────────────
export type StaffRole = "OWNER" | "ADMIN" | "MANAGER" | "STAFF" | "PACKING_STAFF" | "DELIVERY_PARTNER";

export const ROLE_PRESETS: Record<StaffRole, PermissionKey[]> = {
  OWNER: Object.keys(PERMISSIONS) as PermissionKey[],
  ADMIN: Object.keys(PERMISSIONS) as PermissionKey[],
  MANAGER: [
    "orders.view", "orders.manage",
    "requests.view", "requests.manage",
    "dispatch.view", "dispatch.manage",
    "returns.view", "returns.manage",
    "catalogue.view", "catalogue.manage",
    "customers.view", "customers.manage",
    "collections.view",
    "reports.view",
    "marketing.view",
  ],
  STAFF: [
    "orders.view", "orders.manage",
    "requests.view", "requests.manage",
    "catalogue.view", "catalogue.manage",
    "dispatch.view",
  ],
  PACKING_STAFF: [
    "orders.view",
  ],
  DELIVERY_PARTNER: [
    "dispatch.view",
    "collections.view",
  ],
};

// Permissions that delivery/packing roles are NEVER allowed to receive
const RESTRICTED_FOR_DELIVERY: PermissionKey[] = [
  "collections.reconcile", "staff.manage", "settings.manage",
  "pricing.manage", "marketing.view", "marketing.manage",
  "audit.view", "customers.manage",
];

const RESTRICTED_FOR_PACKING: PermissionKey[] = [
  "collections.reconcile", "staff.manage", "settings.manage",
  "pricing.manage", "marketing.view", "marketing.manage",
  "audit.view", "customers.manage", "dispatch.manage",
  "returns.refund", "collections.view",
];

// ─── Permission Ceiling (what a role CAN have at maximum) ────────────────────────
export function getPermissionCeiling(role: StaffRole): PermissionKey[] {
  if (role === "OWNER" || role === "ADMIN") return Object.keys(PERMISSIONS) as PermissionKey[];

  const allPerms = Object.keys(PERMISSIONS) as PermissionKey[];
  if (role === "DELIVERY_PARTNER") return allPerms.filter((p) => !RESTRICTED_FOR_DELIVERY.includes(p));
  if (role === "PACKING_STAFF") return allPerms.filter((p) => !RESTRICTED_FOR_PACKING.includes(p));

  return allPerms;
}

// ─── Validation ─────────────────────────────────────────────────────────────────
export function validatePermissionsForRole(role: StaffRole, permissions: PermissionKey[]): { valid: boolean; rejected: PermissionKey[] } {
  const ceiling = getPermissionCeiling(role);
  const rejected = permissions.filter((p) => !ceiling.includes(p));
  return { valid: rejected.length === 0, rejected };
}

export function isHighRisk(permission: PermissionKey): boolean {
  return HIGH_RISK_PERMISSIONS.includes(permission);
}

// ─── Full-Access Roles ──────────────────────────────────────────────────────────
const FULL_ACCESS_ROLES: StaffRole[] = ["OWNER", "ADMIN"];

export function hasFullAccess(role: string): boolean {
  return FULL_ACCESS_ROLES.includes(role as StaffRole);
}

// ─── Authorization Check ────────────────────────────────────────────────────────
export interface AuthContext {
  userId: string;
  role: string;
  permissions: string[];
}

/**
 * Check if a user has a specific permission.
 * Owners and legacy Admins always pass.
 */
export function hasPermission(ctx: AuthContext, required: PermissionKey | PermissionKey[]): boolean {
  if (hasFullAccess(ctx.role)) return true;
  const needed = Array.isArray(required) ? required : [required];
  return needed.some((p) => ctx.permissions.includes(p));
}

/**
 * Check if user has ALL listed permissions.
 */
export function hasAllPermissions(ctx: AuthContext, required: PermissionKey[]): boolean {
  if (hasFullAccess(ctx.role)) return true;
  return required.every((p) => ctx.permissions.includes(p));
}

/**
 * Assert permission — throws if denied.
 */
export function assertPermission(ctx: AuthContext, required: PermissionKey | PermissionKey[]): void {
  if (!hasPermission(ctx, required)) {
    throw new PermissionDeniedError(Array.isArray(required) ? required : [required]);
  }
}

export class PermissionDeniedError extends Error {
  public code = "PERMISSION_DENIED" as const;
  public requiredPermissions: PermissionKey[];

  constructor(permissions: PermissionKey[]) {
    super(`Permission denied. Required: ${permissions.join(", ")}`);
    this.requiredPermissions = permissions;
  }
}
