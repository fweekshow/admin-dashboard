import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const meds = await prisma.userMeds.findMany({
      include: {
        user: {
          select: { id: true, name: true, walletAddress: true, conversationId: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(meds);
  } catch (error) {
    console.error("Medications GET error:", error);
    return NextResponse.json({ error: "Failed to fetch medications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { userId, schedule } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const existing = await prisma.userMeds.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json(
        { error: "Medications already exist for this user. Use PUT to update." },
        { status: 409 }
      );
    }

    const med = await prisma.userMeds.create({
      data: {
        userId,
        schedule: schedule || {},
      },
      include: {
        user: {
          select: { id: true, name: true, walletAddress: true, conversationId: true },
        },
      },
    });
    return NextResponse.json(med, { status: 201 });
  } catch (error) {
    console.error("Medications POST error:", error);
    return NextResponse.json({ error: "Failed to create medication record" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { id, schedule } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const med = await prisma.userMeds.update({
      where: { id },
      data: { schedule },
      include: {
        user: {
          select: { id: true, name: true, walletAddress: true, conversationId: true },
        },
      },
    });
    return NextResponse.json(med);
  } catch (error) {
    console.error("Medications PUT error:", error);
    return NextResponse.json({ error: "Failed to update medication record" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.userMeds.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Medications DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete medication record" }, { status: 500 });
  }
}
