import { NextResponse } from "next/server";

// Legacy route - redirect to quick-actions
export async function GET() {
  return NextResponse.redirect(new URL("/api/quick-actions", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"));
}

export async function POST() {
  return NextResponse.json(
    { error: "Use /api/quick-actions instead" },
    { status: 410 }
  );
}

