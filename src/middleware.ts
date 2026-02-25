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

  const adminPassword = process.env.ADMIN_PASSWORD || "";
  let isAuthenticated = false;

  // Path 1: Cookie — verify hashed token
  const cookieValue = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookieValue) {
    const expectedToken = await sha256(adminPassword + TOKEN_SALT);
    isAuthenticated = cookieValue === expectedToken;
  }

  // Path 2: Header — check raw admin secret (server-to-server only)
  if (!isAuthenticated) {
    const headerValue = request.headers.get(AUTH_HEADER);
    isAuthenticated = !!headerValue && headerValue === adminPassword;
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

