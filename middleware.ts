import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

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
  const user = request.auth?.user;

  if (isAdminRoute && !isAdminLoginRoute && user?.role !== "ADMIN") {
    const loginUrl = new URL("/admin/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  if (isDashboardRoute && !user) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/:path*"]
};
