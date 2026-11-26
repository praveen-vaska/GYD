import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    (pathname === "/admin" || pathname.startsWith("/admin/")) &&
    pathname !== "/admin/login"
  ) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const verified = await verifyAdminSessionToken(token);
    if (!verified.valid) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
