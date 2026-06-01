import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token?.id)
    }
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/album/:path*",
    "/repeated/:path*",
    "/missing/:path*",
    "/matches/:path*",
    "/profile/:path*",
    "/admin/:path*"
  ]
};
