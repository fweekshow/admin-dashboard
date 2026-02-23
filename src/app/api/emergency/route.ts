import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const contacts = await prisma.emergencyContact.findMany({ orderBy: [{ priority: "asc" }, { name: "asc" }] });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Emergency GET error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const item = await prisma.emergencyContact.create({
      data: {
        name: body.name,
        phoneNumber: body.phoneNumber,
        type: body.type,
        notes: body.notes || null,
        priority: body.priority ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Emergency POST error:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const item = await prisma.emergencyContact.update({
      where: { id: body.id },
      data: {
        name: body.name,
        phoneNumber: body.phoneNumber,
        type: body.type,
        notes: body.notes || null,
        priority: body.priority ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Emergency PUT error:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.emergencyContact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Emergency DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
