import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret";
const ACCESS_TOKEN_EXPIRY = 900; // 15 minutes in seconds

export interface MobileTokenPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Generate a short-lived JWT access token for mobile clients.
 */
export function generateAccessToken(userId: string, role: string): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { sub: userId, role, iat: now, exp: now + ACCESS_TOKEN_EXPIRY },
    JWT_SECRET
  );
}

/**
 * Generate a random refresh token (opaque string).
 */
export function generateRefreshToken(): string {
  return crypto.randomUUID();
}

/**
 * Hash a refresh token for secure storage.
 */
export async function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

/**
 * Compare a raw refresh token against its stored hash.
 */
export async function compareRefreshToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

/**
 * Verify and decode a JWT access token.
 * Returns the decoded payload or null if invalid/expired.
 */
export function verifyAccessToken(token: string): MobileTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as MobileTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extract and verify the Bearer token from a request's Authorization header.
 * Returns the decoded payload or null.
 */
export function authenticateMobileRequest(request: Request): { userId: string; role: string } | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);
  if (!payload) return null;

  return { userId: payload.sub, role: payload.role };
}
