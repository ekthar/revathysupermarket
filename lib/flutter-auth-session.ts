import { auth } from "@/auth";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

/**
 * Session-compatible object returned by getSessionOrBearer.
 * Mirrors the shape of NextAuth's Session so API routes can use it interchangeably.
 */
export interface FlutterSession {
  user: {
    id: string;
    role: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    passwordVersion?: number;
    authVersion?: number;
    permissions?: string[];
  };
}

interface FlutterJwtPayload {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  passwordVersion?: number;
  authVersion?: number;
}

/**
 * Hybrid auth utility that tries NextAuth session (cookies) first,
 * then falls back to verifying a Bearer JWT from the Authorization header.
 *
 * This enables API routes to authenticate both:
 * - Browser-based requests using NextAuth session cookies
 * - Flutter app requests using Bearer tokens issued by /api/flutter-auth
 *
 * Returns a session-compatible object or null if authentication fails.
 */
export async function getSessionOrBearer(request: Request): Promise<FlutterSession | null> {
  // 1. Try NextAuth session first (cookie-based auth)
  const session = await auth();
  if (session?.user?.id && session.user.role !== "INVALID") {
    return session as FlutterSession;
  }

  // 2. Fall back to Bearer token from Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return null;
  }

  let payload: FlutterJwtPayload;
  try {
    payload = jwt.verify(token, secret) as FlutterJwtPayload;
  } catch {
    return null;
  }

  if (!payload.id) {
    return null;
  }

  // 3. Verify the user is still active and token versions match
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      passwordVersion: true,
      authVersion: true,
      staffPermissions: { select: { permission: true } },
    },
  }).catch(() => null);

  if (!user || !user.isActive) {
    return null;
  }

  // Check passwordVersion and authVersion match the token
  const tokenPasswordVersion = payload.passwordVersion ?? 0;
  const tokenAuthVersion = payload.authVersion ?? 0;

  if (user.passwordVersion !== tokenPasswordVersion || user.authVersion !== tokenAuthVersion) {
    return null;
  }

  return {
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      passwordVersion: user.passwordVersion,
      authVersion: user.authVersion,
      permissions: user.staffPermissions.map((entry) => entry.permission),
    },
  };
}
