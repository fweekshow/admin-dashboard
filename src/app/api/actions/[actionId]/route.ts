import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ actionId: string }>;
}

// Legacy route - return 410 Gone
export async function GET() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/quick-actions instead." },
    { status: 410 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "This endpoint is deprecated." },
    { status: 410 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "This endpoint is deprecated." },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "This endpoint is deprecated." },
    { status: 410 }
  );
}

