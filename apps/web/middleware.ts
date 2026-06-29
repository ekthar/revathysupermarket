import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { isAllowedMobileCorsOrigin, mobileOptionsResponse } from "@/lib/mobile-cors";
import { isSameOriginRequest } from "@/lib/request-security";
import {
  checkRateLimit,
  getLimiterForRoute,
  resolveRateLimitKey,
  type RateLimitResult,
} from "@/lib/rate-limiters";

const { auth } = NextAuth(authConfig);
const staffRoles = new Set(["ADMIN", "STAFF", "OWNER", "MANAGER", "PACKING_STAFF"]);

// Routes exempt from rate limiting (health checks, auth callbacks, static assets)
const RATE_LIMIT_EXEMPT = new Set([
  "/api/health",
  "/api/auth/session",
  "/api/auth/csrf",
  "/api/auth/providers",
  "/api/auth/callback/staff-credentials",
  "/api/auth/callback/phone-otp",
  "/api/auth/callback/google",
  "/api/auth/callback/credentials",
  "/api/auth/signin",
  "/api/auth/signout",
]);

function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
    ...(result.limited ? { "Retry-After": String(retryAfter) } : {}),
  };
}

export default auth(async (request) => {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");
  const isMobileWebAuthRoute =
    pathname === "/api/auth/google" ||
    pathname === "/api/auth/me" ||
    pathname === "/api/mobile/v1/auth/google" ||
    pathname === "/api/mobile/v1/auth/me";

  // ─── CORS preflight ─────────────────────────────────────────────────────────
  if (isApiRoute && request.method === "OPTIONS") {
    return mobileOptionsResponse(request);
  }

  // ─── CSRF protection: reject cross-origin mutating requests ─────────────────
  const isMutatingRequest = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const isAllowedCorsApiRequest = isApiRoute && isAllowedMobileCorsOrigin(request);
  if (
    isMutatingRequest &&
    !isMobileWebAuthRoute &&
    !isAllowedCorsApiRequest &&
    !isSameOriginRequest(request)
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  // ─── Rate limiting for API routes ──────────────────────────────────────────
  if (isApiRoute && !RATE_LIMIT_EXEMPT.has(pathname) && !pathname.startsWith("/api/auth/callback")) {
    const userId = request.auth?.user?.id;
    const key = resolveRateLimitKey(userId, request);
    const limiterName = getLimiterForRoute(pathname, request.method);

    const result = await checkRateLimit(limiterName, key);
    
    if (result.limited) {
      const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      return NextResponse.json(
        {
          error: "RATE_LIMITED",
          message: "Too many requests. Please try again shortly.",
          retryAfter,
        },
        {
          status: 429,
          headers: rateLimitHeaders(result),
        }
      );
    }

    // Attach rate limit headers to successful responses via a rewrite trick:
    // We'll add them as response headers. Since middleware can't modify response 
    // headers for pass-through, we store them in request headers for downstream use.
    const response = NextResponse.next();
    const headers = rateLimitHeaders(result);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }

    // Continue with auth checks below but use the response object
    const authResult = handleAuthRedirects(request);
    if (authResult) return authResult;

    return response;
  }

  // ─── Auth-based route protection (non-API routes) ──────────────────────────
  return handleAuthRedirects(request);
});

function handleAuthRedirects(request: { nextUrl: URL; auth?: { user?: { id?: string; role?: string } } | null }) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname === "/admin/login";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isCheckoutRoute = pathname.startsWith("/checkout");
  const isDeliveryRoute = pathname.startsWith("/delivery");
  const isDeliveryLoginRoute = pathname === "/delivery/login";
  const user = request.auth?.user;
  const role = String(user?.role ?? "");

  if (isAdminRoute && !isAdminLoginRoute && role === "DELIVERY_PARTNER") {
    return Response.redirect(new URL("/delivery", request.nextUrl));
  }

  if (isAdminRoute && !isAdminLoginRoute && !staffRoles.has(role)) {
    const loginUrl = new URL("/admin/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    if (user) loginUrl.searchParams.set("reason", "staff_required");
    return Response.redirect(loginUrl);
  }

  if ((isDashboardRoute || isCheckoutRoute) && !user) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  if ((isDashboardRoute || isCheckoutRoute) && staffRoles.has(role)) {
    return Response.redirect(new URL("/admin", request.nextUrl));
  }

  if ((isDashboardRoute || isCheckoutRoute) && role === "DELIVERY_PARTNER") {
    return Response.redirect(new URL("/delivery", request.nextUrl));
  }

  if (isDeliveryRoute && !isDeliveryLoginRoute && role !== "DELIVERY_PARTNER") {
    const loginUrl = new URL("/delivery/login", request.nextUrl);
    if (user) loginUrl.searchParams.set("reason", "delivery_required");
    return Response.redirect(loginUrl);
  }

  return undefined;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/checkout/:path*", "/delivery/:path*", "/api/:path*"],
};
