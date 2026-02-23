import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const items = await prisma.dailyScheduleTemplate.findMany({
      orderBy: [{ startTime: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Schedule GET error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const item = await prisma.dailyScheduleTemplate.create({
      data: {
        startTime: body.startTime,
        endTime: body.endTime || null,
        blockType: body.blockType,
        activity: body.activity,
        location: body.location || null,
        notes: body.notes || null,
        daysOfWeek: body.daysOfWeek ?? [],
        refersToMeal: body.refersToMeal ?? false,
        refersToActivity: body.refersToActivity ?? false,
        refersToMeds: body.refersToMeds ?? false,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Schedule POST error:", error);
    return NextResponse.json({ error: "Failed to create schedule block" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const item = await prisma.dailyScheduleTemplate.update({
      where: { id: body.id },
      data: {
        startTime: body.startTime,
        endTime: body.endTime || null,
        blockType: body.blockType,
        activity: body.activity,
        location: body.location || null,
        notes: body.notes || null,
        daysOfWeek: body.daysOfWeek ?? [],
        refersToMeal: body.refersToMeal ?? false,
        refersToActivity: body.refersToActivity ?? false,
        refersToMeds: body.refersToMeds ?? false,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Schedule PUT error:", error);
    return NextResponse.json({ error: "Failed to update schedule block" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.dailyScheduleTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Schedule DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete schedule block" }, { status: 500 });
  }
}
