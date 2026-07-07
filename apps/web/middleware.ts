import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { isAllowedMobileCorsOrigin, mobileOptionsResponse } from "@/lib/mobile-cors";
import { isSameOriginRequest } from "@/lib/request-security";

const { auth } = NextAuth(authConfig);
const staffRoles = new Set(["ADMIN", "STAFF", "OWNER", "MANAGER", "PACKING_STAFF"]);

export default auth((request) => {
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isMobileWebAuthRoute =
    request.nextUrl.pathname === "/api/auth/google" ||
    request.nextUrl.pathname === "/api/auth/me" ||
    request.nextUrl.pathname === "/api/mobile/v1/auth/google" ||
    request.nextUrl.pathname === "/api/mobile/v1/auth/me";

  if (isApiRoute && request.method === "OPTIONS") {
    return mobileOptionsResponse(request);
  }

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

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLoginRoute = request.nextUrl.pathname === "/admin/login";
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isCheckoutRoute = request.nextUrl.pathname.startsWith("/checkout");
  const isDeliveryRoute = request.nextUrl.pathname.startsWith("/delivery");
  const isDeliveryLoginRoute = request.nextUrl.pathname === "/delivery/login";
  // Customer shopping surface — a delivery partner should never end up here.
  // Their app is exactly one screen: their assigned orders (/delivery).
  const isCustomerShoppingRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/products") ||
    request.nextUrl.pathname.startsWith("/cart") ||
    request.nextUrl.pathname.startsWith("/account") ||
    request.nextUrl.pathname.startsWith("/offers");
  const user = request.auth?.user;
  const role = String(user?.role ?? "");

  if (isAdminRoute && !isAdminLoginRoute && role === "DELIVERY_PARTNER") {
    return Response.redirect(new URL("/delivery", request.nextUrl));
  }

  if (isCustomerShoppingRoute && role === "DELIVERY_PARTNER") {
    return Response.redirect(new URL("/delivery", request.nextUrl));
  }

  if (isCustomerShoppingRoute && staffRoles.has(role)) {
    return Response.redirect(new URL("/admin", request.nextUrl));
  }

  if (isAdminRoute && !isAdminLoginRoute && !staffRoles.has(role)) {
    const loginUrl = new URL("/admin/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    if (user) loginUrl.searchParams.set("reason", "staff_required");
    return Response.redirect(loginUrl);
  }

  if ((isDashboardRoute || isCheckoutRoute) && !user) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
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
});

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/dashboard/:path*",
    "/checkout/:path*",
    "/delivery/:path*",
    "/products/:path*",
    "/cart/:path*",
    "/account/:path*",
    "/offers/:path*",
    '/api/((?!products|store-settings|promo-codes|offers|categories|banners|mobile).*)'
  ]
};
