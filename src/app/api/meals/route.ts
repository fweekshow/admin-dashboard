import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const meals = await prisma.mealTemplate.findMany({
      orderBy: [{ mealType: "asc" }, { startTime: "asc" }],
    });
    return NextResponse.json(meals);
  } catch (error) {
    console.error("Meals GET error:", error);
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const meal = await prisma.mealTemplate.create({
      data: {
        mealType: body.mealType,
        items: body.items ?? [],
        notes: body.notes || null,
        daysOfWeek: body.daysOfWeek ?? [],
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        date: body.date ? new Date(body.date) : null,
        nutritionHighlights: body.nutritionHighlights ?? null,
      },
    });
    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error("Meals POST error:", error);
    return NextResponse.json({ error: "Failed to create meal" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const meal = await prisma.mealTemplate.update({
      where: { id: body.id },
      data: {
        mealType: body.mealType,
        items: body.items ?? [],
        notes: body.notes || null,
        daysOfWeek: body.daysOfWeek ?? [],
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        date: body.date ? new Date(body.date) : null,
        nutritionHighlights: body.nutritionHighlights ?? null,
      },
    });
    return NextResponse.json(meal);
  } catch (error) {
    console.error("Meals PUT error:", error);
    return NextResponse.json({ error: "Failed to update meal" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await prisma.mealTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Meals DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete meal" }, { status: 500 });
  }
}
