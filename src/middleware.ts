import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/admin")) {
    const token = request.cookies.get("token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = verifyToken(token);
    if (!payload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!payload.isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Dashboard / inbox protected
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/inbox") || pathname.startsWith("/api/mailboxes") || pathname.startsWith("/api/inbox")) {
    const token = request.cookies.get("token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = verifyToken(token);
    if (!payload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!payload.isAuthorized && !payload.isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Account not authorized. Contact admin." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/pending", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/inbox/:path*"],
};
