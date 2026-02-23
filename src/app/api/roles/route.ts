import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Roles GET error:", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}
