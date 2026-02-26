import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, AUTH_HEADER, TOKEN_SALT } from "@/lib/constants";


async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for login page and API login endpoint
  if (pathname === "/login" || pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  // if ADMIN_PASSWORD is not configured, block all requests
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let isAuthenticated = false;

  // Path 1: Cookie — verify hashed token (browser sessions)
  const cookieValue = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookieValue) {
    const expectedToken = await sha256(adminPassword + TOKEN_SALT);
    isAuthenticated = cookieValue === expectedToken;
  }

  // Path 2: Header — verify hashed token (server-to-server, API routes only)
  if (!isAuthenticated && pathname.startsWith("/api/")) {
    const headerValue = request.headers.get(AUTH_HEADER);
    if (headerValue) {
      const expectedToken = await sha256(adminPassword + TOKEN_SALT);
      isAuthenticated = headerValue === expectedToken;
    }
  }

  if (isAuthenticated) {
    return NextResponse.next();
  }

  // Unauthenticated: API routes get 401 JSON, pages get redirect
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};

