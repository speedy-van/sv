import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/admin", "/driver", "/customer"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const prefix of PROTECTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const cookieToken = request.cookies.get("sv-auth-token")?.value;
      const headerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      const token = cookieToken || headerToken;
      if (!token) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/driver/:path*", "/customer/:path*"],
};
