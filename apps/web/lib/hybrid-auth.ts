import { auth } from "@/auth";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { isDeliveryRole } from "@/lib/authz";

/**
 * Hybrid authentication for delivery endpoints.
 *
 * Checks for a mobile Bearer token first; if not present, falls back to
 * NextAuth session-based authentication. This allows the same endpoints to
 * serve both the Flutter mobile app and the Next.js web delivery partner UI.
 */
export async function authenticateDeliveryRequest(
  request: Request
): Promise<{ userId: string; role: string } | null> {
  // Try mobile auth first (Bearer token in Authorization header)
  const mobileAuth = authenticateMobileRequest(request);
  if (mobileAuth) {
    if (!isDeliveryRole(mobileAuth.role)) return null;
    return mobileAuth;
  }

  // Fall back to session-based auth (web UI)
  const session = await auth();
  if (!session?.user?.id || !isDeliveryRole(session.user.role)) return null;

  return { userId: session.user.id, role: session.user.role };
}

/**
 * Variant that checks for the specific DELIVERY_PARTNER role string
 * (matching the original strict checks in poll/complete/collect/damage).
 */
export async function authenticateDeliveryPartnerRequest(
  request: Request
): Promise<{ userId: string; role: string } | null> {
  // Try mobile auth first
  const mobileAuth = authenticateMobileRequest(request);
  if (mobileAuth) {
    if (mobileAuth.role !== "DELIVERY_PARTNER") return null;
    return mobileAuth;
  }

  // Fall back to session-based auth
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DELIVERY_PARTNER") return null;

  return { userId: session.user.id, role: session.user.role };
}
