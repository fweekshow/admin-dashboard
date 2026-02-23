import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const staff = await prisma.staffMember.findMany({
      include: {
        reportsTo: { select: { id: true, name: true } },
      },
      orderBy: [{ name: "asc" }],
    });
    return NextResponse.json(staff);
  } catch (error) {
    console.error("Staff GET error:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const member = await prisma.staffMember.create({
      data: {
        name: body.name,
        title: body.title || null,
        division: body.division || null,
        email: body.email || null,
        phone: body.phone || null,
        reportsToId: body.reportsToId || null,
        bhrStatus: body.bhrStatus || null,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Staff POST error:", error);
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const member = await prisma.staffMember.update({
      where: { id: body.id },
      data: {
        name: body.name,
        title: body.title || null,
        division: body.division || null,
        email: body.email || null,
        phone: body.phone || null,
        reportsToId: body.reportsToId || null,
        bhrStatus: body.bhrStatus || null,
      },
    });
    return NextResponse.json(member);
  } catch (error) {
    console.error("Staff PUT error:", error);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.staffMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Staff DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
  }
}
