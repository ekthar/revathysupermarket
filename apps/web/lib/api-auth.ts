import { NextResponse } from "next/server";
import { auth } from "@/auth";

export interface AuthSession {
  user: {
    id: string;
    role: string;
    name: string | null;
    email: string;
    phone: string | null;
    passwordVersion: number;
    authVersion: number;
    permissions: string[];
  };
}

/**
 * Require the current user to have one of the specified roles.
 * Returns the session if authorized, or a NextResponse error if not.
 *
 * @deprecated Migrate to `requirePermission()` from `@/lib/require-permission`.
 * The role-based approach does not support granular permissions. Use the new
 * permission system instead:
 * ```ts
 * import { requirePermission } from "@/lib/require-permission";
 * const result = await requirePermission('orders.manage');
 * if (!result.authorized) return result.response;
 * ```
 *
 * This function is preserved for backward compatibility during migration.
 *
 * @see {@link file://@/lib/require-permission.ts}
 */
export async function requireRole(
  roles: string[]
): Promise<AuthSession | NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!roles.includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return session as unknown as AuthSession;
}
