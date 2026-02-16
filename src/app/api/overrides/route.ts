import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const overrides = await prisma.actionOverride.findMany({
      orderBy: { actionId: "asc" },
    });
    return NextResponse.json(overrides);
  } catch (error) {
    console.error("Failed to fetch overrides:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { actionId, enabled, text } = body;

    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 });
    }

    const override = await prisma.actionOverride.upsert({
      where: { actionId },
      update: {
        enabled: enabled ?? false,
        text: text ?? "",
      },
      create: {
        actionId,
        enabled: enabled ?? false,
        text: text ?? "",
      },
    });

    return NextResponse.json(override);
  } catch (error) {
    console.error("Failed to save override:", error);
    return NextResponse.json({ error: "Failed to save override" }, { status: 500 });
  }
}

