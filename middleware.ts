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
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const user = request.auth?.user;

  if (isAdminRoute && user?.role !== "ADMIN") {
    return Response.redirect(new URL("/login", request.nextUrl));
  }

  if (isDashboardRoute && !user) {
    return Response.redirect(new URL("/login", request.nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/:path*"]
};
