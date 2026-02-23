import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const [
      meals,
      activities,
      scheduleBlocks,
      staff,
      guidelines,
      houseRules,
      emergencyContacts,
      users,
      housekeeping,
      laundry,
    ] = await Promise.all([
      prisma.mealTemplate.count(),
      prisma.activityTemplate.count(),
      prisma.dailyScheduleTemplate.count(),
      prisma.staffMember.count(),
      prisma.guideline.count(),
      prisma.houseRule.count(),
      prisma.emergencyContact.count(),
      prisma.user.count(),
      prisma.housekeepingSchedule.count(),
      prisma.laundrySchedule.count(),
    ]);

    return NextResponse.json({
      meals,
      activities,
      scheduleBlocks,
      staff,
      guidelines,
      houseRules,
      emergencyContacts,
      users,
      housekeeping,
      laundry,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
