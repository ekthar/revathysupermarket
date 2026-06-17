import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);
const staffRoles = new Set(["ADMIN", "STAFF", "OWNER", "MANAGER", "PACKING_STAFF"]);

export default auth((request) => {
  const isMutatingRequest = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (isMutatingRequest) {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.nextUrl.host) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLoginRoute = request.nextUrl.pathname === "/admin/login";
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isCheckoutRoute = request.nextUrl.pathname.startsWith("/checkout");
  const isDeliveryRoute = request.nextUrl.pathname.startsWith("/delivery");
  const user = request.auth?.user;

  if (isAdminRoute && !isAdminLoginRoute && !staffRoles.has(String(user?.role ?? ""))) {
    const loginUrl = new URL("/admin/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  if ((isDashboardRoute || isCheckoutRoute) && !user) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  if (isDeliveryRoute && user?.role !== "DELIVERY_PARTNER") {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/checkout/:path*", "/delivery/:path*", "/api/:path*"]
};
