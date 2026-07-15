import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission, hasFullAccess, type AuthContext, type PermissionKey } from "@/lib/permissions";
import type { Session } from "next-auth";

/**
 * Unified API route guard — combines authentication + permission check in one call.
 *
 * Usage:
 * ```ts
 * export async function GET() {
 *   const result = await requirePermission('orders.manage');
 *   if (!result.authorized) return result.response;
 *   // result.session and result.ctx are available
 * }
 * ```
 */
export async function requirePermission(
  permission: PermissionKey
): Promise<
  | { authorized: true; session: Session; ctx: AuthContext }
  | { authorized: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }

  const ctx = await getAuthContext();
  if (!ctx) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }

  if (!hasFullAccess(ctx.role) && !hasPermission(ctx, permission)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          code: "MISSING_PERMISSION",
          required: permission,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session, ctx };
}

/**
 * Require any of multiple permissions — passes if the user has at least one.
 *
 * Usage:
 * ```ts
 * const result = await requireAnyPermission(['orders.view', 'orders.manage']);
 * if (!result.authorized) return result.response;
 * ```
 */
export async function requireAnyPermission(
  permissions: PermissionKey[]
): Promise<
  | { authorized: true; session: Session; ctx: AuthContext }
  | { authorized: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }

  const ctx = await getAuthContext();
  if (!ctx) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }

  if (!hasFullAccess(ctx.role) && !hasPermission(ctx, permissions)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Forbidden",
          code: "MISSING_PERMISSION",
          required: permissions,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session, ctx };
}
