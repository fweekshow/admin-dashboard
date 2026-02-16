import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const actions = await prisma.actionConfig.findMany({
      orderBy: { actionId: "asc" },
    });
    return NextResponse.json(actions);
  } catch (error) {
    console.error("Failed to fetch actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch actions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();

    const action = await prisma.actionConfig.create({
      data: {
        actionId: body.actionId,
        label: body.label,
        enabled: body.enabled ?? true,
        responseType: body.responseType,
        staticText: body.staticText ?? null,
        dataSource: body.dataSource ?? null,
        templateFormat: body.templateFormat ?? null,
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("Failed to create action:", error);
    return NextResponse.json(
      { error: "Failed to create action" },
      { status: 500 }
    );
  }
}

