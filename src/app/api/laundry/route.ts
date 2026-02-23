import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const items = await prisma.laundrySchedule.findMany({
      include: { client: { select: { id: true, name: true } } },
      orderBy: [{ date: "desc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Laundry GET error:", error);
    return NextResponse.json({ error: "Failed to fetch laundry" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const item = await prisma.laundrySchedule.create({
      data: {
        date: new Date(body.date),
        dayOfWeek: body.dayOfWeek,
        memberName: body.memberName || null,
        clientId: body.clientId || null,
        roomNumber: body.roomNumber || null,
        laundryType: body.laundryType,
        laundryVendor: body.laundryVendor || null,
        expectedReturnDate: body.expectedReturnDate ? new Date(body.expectedReturnDate) : null,
        conditionCheck: body.conditionCheck ?? null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Laundry POST error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const item = await prisma.laundrySchedule.update({
      where: { id: body.id },
      data: {
        date: new Date(body.date),
        dayOfWeek: body.dayOfWeek,
        memberName: body.memberName || null,
        clientId: body.clientId || null,
        roomNumber: body.roomNumber || null,
        laundryType: body.laundryType,
        laundryVendor: body.laundryVendor || null,
        expectedReturnDate: body.expectedReturnDate ? new Date(body.expectedReturnDate) : null,
        conditionCheck: body.conditionCheck ?? null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Laundry PUT error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.laundrySchedule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Laundry DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
