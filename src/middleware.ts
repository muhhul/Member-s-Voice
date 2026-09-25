import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";

/**
 * First of the two protection layers: a cheap signature check that never
 * touches the database, so an unauthenticated request to /admin is turned away
 * before it can spin up a Neon connection.
 *
 * It deliberately does NOT check is_active or role. That requires the database,
 * and it is requireRole()'s job. This runs on the Edge runtime, so nothing here
 * may import bcryptjs, node:crypto, or the database client.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
