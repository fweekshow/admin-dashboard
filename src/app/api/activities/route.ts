import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const activities = await prisma.activityTemplate.findMany({
      include: { facilitator: { select: { id: true, name: true } } },
      orderBy: [{ startTime: "asc" }],
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Activities GET error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const activity = await prisma.activityTemplate.create({
      data: {
        name: body.name,
        description: body.description || null,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location || null,
        daysOfWeek: body.daysOfWeek ?? [],
        notes: body.notes || null,
        date: body.date ? new Date(body.date) : null,
        facilitatorId: body.facilitatorId || null,
      },
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Activities POST error:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const activity = await prisma.activityTemplate.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description || null,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location || null,
        daysOfWeek: body.daysOfWeek ?? [],
        notes: body.notes || null,
        date: body.date ? new Date(body.date) : null,
        facilitatorId: body.facilitatorId || null,
      },
    });
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Activities PUT error:", error);
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.activityTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Activities DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 });
  }
}
