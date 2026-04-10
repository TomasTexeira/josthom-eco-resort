import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware de Next.js - protege las rutas /admin/*
 * Si no hay token en las cookies, redirige al login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rutas /admin
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("josthom_access");

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
