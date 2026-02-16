import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ actionId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const prisma = getPrisma();
    const { actionId } = await params;

    const action = await prisma.actionConfig.findUnique({
      where: { actionId },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(action);
  } catch (error) {
    console.error("Failed to fetch action:", error);
    return NextResponse.json(
      { error: "Failed to fetch action" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const prisma = getPrisma();
    const { actionId } = await params;
    const body = await request.json();

    const action = await prisma.actionConfig.update({
      where: { actionId },
      data: {
        label: body.label,
        enabled: body.enabled,
        responseType: body.responseType,
        staticText: body.staticText,
        dataSource: body.dataSource,
        templateFormat: body.templateFormat,
      },
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error("Failed to update action:", error);
    return NextResponse.json(
      { error: "Failed to update action" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const prisma = getPrisma();
    const { actionId } = await params;
    const body = await request.json();

    // Only update fields that are provided
    const updateData: Record<string, unknown> = {};
    if (body.label !== undefined) updateData.label = body.label;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;
    if (body.responseType !== undefined) updateData.responseType = body.responseType;
    if (body.staticText !== undefined) updateData.staticText = body.staticText;
    if (body.dataSource !== undefined) updateData.dataSource = body.dataSource;
    if (body.templateFormat !== undefined) updateData.templateFormat = body.templateFormat;

    const action = await prisma.actionConfig.update({
      where: { actionId },
      data: updateData,
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error("Failed to update action:", error);
    return NextResponse.json(
      { error: "Failed to update action" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const prisma = getPrisma();
    const { actionId } = await params;

    await prisma.actionConfig.delete({
      where: { actionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete action:", error);
    return NextResponse.json(
      { error: "Failed to delete action" },
      { status: 500 }
    );
  }
}

