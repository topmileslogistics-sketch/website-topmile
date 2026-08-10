import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

/**
 * First line of defence for the admin area.
 *
 * Runs before any page or route handler, so an unauthenticated request never
 * reaches code that queries applicant records.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  // Already signed in → skip the login page.
  if (pathname === "/admin/login") {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (session) return NextResponse.next();

  // API routes get a JSON 401 rather than an HTML redirect.
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  // Preserve where they were heading, but only as a relative path so this
  // cannot be abused as an open redirect.
  const target = `${pathname}${search}`;
  if (target.startsWith("/admin")) {
    loginUrl.searchParams.set("next", target);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
