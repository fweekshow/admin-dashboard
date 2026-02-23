import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const items = await prisma.housekeepingSchedule.findMany({
      include: { assignedStaff: { select: { id: true, name: true } } },
      orderBy: [{ date: "desc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Housekeeping GET error:", error);
    return NextResponse.json({ error: "Failed to fetch housekeeping" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const item = await prisma.housekeepingSchedule.create({
      data: {
        date: new Date(body.date),
        dayOfWeek: body.dayOfWeek,
        roomArea: body.roomArea || null,
        taskType: body.taskType || null,
        dailyTasksCompleted: body.dailyTasksCompleted || null,
        assignedStaffId: body.assignedStaffId || null,
        supervisorInitials: body.supervisorInitials || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Housekeeping POST error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const item = await prisma.housekeepingSchedule.update({
      where: { id: body.id },
      data: {
        date: new Date(body.date),
        dayOfWeek: body.dayOfWeek,
        roomArea: body.roomArea || null,
        taskType: body.taskType || null,
        dailyTasksCompleted: body.dailyTasksCompleted || null,
        assignedStaffId: body.assignedStaffId || null,
        supervisorInitials: body.supervisorInitials || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Housekeeping PUT error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.housekeepingSchedule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Housekeeping DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
