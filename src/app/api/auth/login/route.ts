import { NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE } from "@/lib/constants";
import { generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error("ADMIN_PASSWORD not set in environment");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Set authentication cookie with hashed token (never store raw password)
    const token = generateToken(adminPassword);
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

