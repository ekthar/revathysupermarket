import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasFullAccess, hasPermission, type AuthContext, type PermissionKey } from "@/lib/permissions";
import { NextResponse } from "next/server";

/**
 * Get the current user's auth context including permissions.
 * Returns null if not authenticated.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const role = session.user.role || "CUSTOMER";

  // Full-access roles don't need to fetch permissions
  if (hasFullAccess(role)) {
    return { userId: session.user.id, role, permissions: [] };
  }

  // Fetch staff permissions from DB
  const staffPerms = await prisma.staffPermission.findMany({
    where: { userId: session.user.id },
    select: { permission: true },
  });

  return {
    userId: session.user.id,
    role,
    permissions: staffPerms.map((p) => p.permission),
  };
}

/**
 * Require authentication and specific permission(s) for API routes.
 * Returns the auth context on success, or a NextResponse error.
 */
export async function requirePermission(
  ...required: PermissionKey[]
): Promise<{ ctx: AuthContext } | { error: NextResponse }> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return { error: NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 }) };
  }

  if (required.length > 0 && !hasPermission(ctx, required)) {
    return {
      error: NextResponse.json(
        { error: "Permission denied", code: "PERMISSION_DENIED", required },
        { status: 403 }
      ),
    };
  }

  return { ctx };
}

/**
 * Require the user to be an admin-level role (ADMIN, OWNER, MANAGER, STAFF).
 * Does NOT check specific permissions — use requirePermission for that.
 */
export async function requireAdmin(): Promise<{ ctx: AuthContext } | { error: NextResponse }> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return { error: NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 }) };
  }

  const adminRoles = ["ADMIN", "OWNER", "MANAGER", "STAFF", "PACKING_STAFF"];
  if (!adminRoles.includes(ctx.role)) {
    return { error: NextResponse.json({ error: "Access denied", code: "NOT_STAFF" }, { status: 403 }) };
  }

  return { ctx };
}

/**
 * Require the user to be the owner.
 */
export async function requireOwner(): Promise<{ ctx: AuthContext } | { error: NextResponse }> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return { error: NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 }) };
  }

  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Owner access required", code: "NOT_OWNER" }, { status: 403 }) };
  }

  return { ctx };
}

/**
 * Helper for server components to check permission.
 */
export async function canAccess(required: PermissionKey | PermissionKey[]): Promise<boolean> {
  const ctx = await getAuthContext();
  if (!ctx) return false;
  return hasPermission(ctx, required);
}
