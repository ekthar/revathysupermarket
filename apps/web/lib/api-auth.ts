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
 * Usage:
 *   const result = await requireRole(["ADMIN", "OWNER"]);
 *   if (result instanceof NextResponse) return result;
 *   // result is now a valid AuthSession
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
