import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { EXPECTED_HEADERS, TRUTHY_VALUES, FALSY_VALUES, BLOCK_TYPE_ALIASES, LAUNDRY_TYPES } from "@/lib/constants";

interface ParsedRow {
  [key: string]: string;
}

function validateHeaders(csvHeaders: string[], table: string): { valid: boolean; missing: string[]; unexpected: string[] } {
  const expected = EXPECTED_HEADERS[table];
  if (!expected) return { valid: true, missing: [], unexpected: [] };
  const normalizedExpected = expected.map((h) => h.toLowerCase().trim());
  const normalizedCsv = csvHeaders.map((h) => h.toLowerCase().trim());
  const missing = expected.filter((h) => !normalizedCsv.includes(h.toLowerCase().trim()));
  const unexpected = csvHeaders.filter((h) => !normalizedExpected.includes(h.toLowerCase().trim()));
  // At least 50% of expected columns must be present
  const matchCount = expected.length - missing.length;
  const valid = matchCount >= Math.ceil(expected.length * 0.5) && missing.length <= 2;
  return { valid, missing, unexpected };
}

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row: ParsedRow = {};
    headers.forEach((h, idx) => { row[h] = values[idx].trim(); });
    rows.push(row);
  }
  return { headers, rows };
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

function parseDays(val: string): string[] {
  if (!val) return [];
  return val.split(/[,;|]/).map((d) => d.trim()).filter(Boolean);
}

function parseDate(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseBool(val: string): boolean | null {
  if (!val) return null;
  const lower = val.toLowerCase();
  if ((TRUTHY_VALUES as readonly string[]).includes(lower)) return true;
  if ((FALSY_VALUES as readonly string[]).includes(lower)) return false;
  return null;
}

async function importMeals(rows: ParsedRow[]) {
  const prisma = getPrisma();
  let count = 0;
  for (const r of rows) {
    const items = r["Items"] ? r["Items"].split(/[;|]/).map((i) => i.trim()).filter(Boolean) : [];
    await prisma.mealTemplate.create({
      data: {
        date: parseDate(r["Date"]),
        mealType: r["Meal Type"] || "Other",
        items: items,
        startTime: r["Start Time"] || null,
        endTime: r["End Time"] || null,
        daysOfWeek: parseDays(r["Day of Week"] || r["Days of Week"] || ""),
        nutritionHighlights: r["Nutrition Highlights"] ? { text: r["Nutrition Highlights"] } : undefined,
        notes: r["Notes"] || null,
      },
    });
    count++;
  }
  return count;
}

async function importActivities(rows: ParsedRow[]) {
  const prisma = getPrisma();
  let count = 0;
  for (const r of rows) {
    let facilitatorId: string | null = null;
    const facilitatorName = r["Facilitator"];
    if (facilitatorName) {
      const staff = await prisma.staffMember.findFirst({ where: { name: facilitatorName } });
      if (staff) facilitatorId = staff.id;
    }
    await prisma.activityTemplate.create({
      data: {
        name: r["Activity Name"] || r["Name"] || "Unnamed",
        description: r["Description"] || null,
        startTime: r["Start Time"] || "00:00",
        endTime: r["End Time"] || "00:00",
        location: r["Location"] || null,
        daysOfWeek: parseDays(r["Day of Week"] || r["Days of Week"] || ""),
        date: parseDate(r["Date"]),
        facilitatorId,
        notes: r["Notes"] || null,
      },
    });
    count++;
  }
  return count;
}

async function importSchedule(rows: ParsedRow[]) {
  const prisma = getPrisma();
  let count = 0;
  for (const r of rows) {
    const rawType = (r["Block Type"] || "Other").toLowerCase().trim();
    const blockType = BLOCK_TYPE_ALIASES[rawType] || "Other";
    await prisma.dailyScheduleTemplate.create({
      data: {
        startTime: r["Start Time"] || "00:00",
        endTime: r["End Time"] || null,
        blockType: blockType as any,
        activity: r["Activity"] || "",
        location: r["Location"] || null,
        notes: r["Notes"] || null,
        daysOfWeek: parseDays(r["Days of Week"] || ""),
        refersToMeal: parseBool(r["Refers to Meal"]) ?? false,
        refersToActivity: parseBool(r["Refers to Activity"]) ?? false,
        refersToMeds: parseBool(r["Refers to Meds"]) ?? false,
      },
    });
    count++;
  }
  return count;
}

async function importStaff(rows: ParsedRow[]) {
  const prisma = getPrisma();
  const created: { name: string; id: string }[] = [];
  for (const r of rows) {
    const member = await prisma.staffMember.create({
      data: {
        name: r["Name"] || "Unknown",
        title: r["Title"] || null,
        division: r["Division"] || null,
        email: r["Email"] || null,
        phone: r["Phone"] || null,
      },
    });
    created.push({ name: member.name, id: member.id });
  }
  for (const r of rows) {
    const reportsToName = r["Reports To"];
    if (!reportsToName) continue;
    const supervisor = created.find((c) => c.name === reportsToName);
    const member = created.find((c) => c.name === r["Name"]);
    if (supervisor && member) {
      await prisma.staffMember.update({ where: { id: member.id }, data: { reportsToId: supervisor.id } });
    }
  }
  return created.length;
}

async function importGuidelines(rows: ParsedRow[]) {
  const prisma = getPrisma();
  let count = 0;
  for (const r of rows) {
    await prisma.guideline.create({
      data: {
        title: r["Title"] || "Untitled",
        content: r["Content"] || "",
        category: r["Category"] || null,
      },
    });
    count++;
  }
  return count;
}

async function importHouseRules(rows: ParsedRow[]) {
  const prisma = getPrisma();
  let count = 0;
  for (const r of rows) {
    await prisma.houseRule.create({
      data: {
        title: r["Title"] || "Untitled",
        content: r["Content"] || "",
        category: r["Category"] || null,
      },
    });
    count++;
  }
  return count;
}

async function importEmergency(rows: ParsedRow[]) {
  const prisma = getPrisma();
  let count = 0;
  for (const r of rows) {
    await prisma.emergencyContact.create({
      data: {
        name: r["Name"] || "Unknown",
        phoneNumber: r["Phone Number"] || r["Phone"] || "",
        type: r["Type"] || "Other",
        notes: r["Notes"] || null,
        priority: parseInt(r["Priority"]) || 0,
        isActive: true,
      },
    });
    count++;
  }
  return count;
}

async function importHousekeeping(rows: ParsedRow[]) {
  const prisma = getPrisma();
  let count = 0;
  for (const r of rows) {
    let assignedStaffId: string | null = null;
    const staffName = r["Assigned Staff"];
    if (staffName) {
      const staff = await prisma.staffMember.findFirst({ where: { name: staffName } });
      if (staff) assignedStaffId = staff.id;
    }
    const taskTypeRaw = (r["Task Type"] || "").toLowerCase();
    const taskType = taskTypeRaw === "deep" ? "Deep" : "Daily";
    await prisma.housekeepingSchedule.create({
      data: {
        date: parseDate(r["Date"]) || new Date(),
        dayOfWeek: r["Day of Week"] || "",
        roomArea: r["Room/Area"] || r["Room"] || null,
        taskType: taskType as any,
        dailyTasksCompleted: r["Daily Tasks Completed"] || null,
        assignedStaffId,
        timeIn: parseDate(r["Time In"]),
        timeOut: parseDate(r["Time Out"]),
        supervisorInitials: r["Supervisor Initials"] || null,
        notes: r["Notes"] || null,
      },
    });
    count++;
  }
  return count;
}

async function importLaundry(rows: ParsedRow[]) {
  const prisma = getPrisma();
  let count = 0;
  for (const r of rows) {
    const typeRaw = (r["Laundry Type"] || "Personal").trim();
    const laundryType = (LAUNDRY_TYPES as readonly string[]).includes(typeRaw) ? typeRaw : "Personal";
    await prisma.laundrySchedule.create({
      data: {
        date: parseDate(r["Date"]) || new Date(),
        dayOfWeek: r["Day of Week"] || "",
        memberName: r["Member Name"] || null,
        roomNumber: r["Room Number"] || null,
        laundryType: laundryType as any,
        laundryVendor: r["Laundry Vendor"] || null,
        expectedReturnDate: parseDate(r["Expected Return Date"]),
        returnedDate: parseDate(r["Returned Date"]),
        conditionCheck: parseBool(r["Condition Check"]),
        notes: r["Notes"] || null,
      },
    });
    count++;
  }
  return count;
}

async function importMedications(rows: ParsedRow[]) {
  const prisma = getPrisma();
  let count = 0;
  const byUser: Record<string, { medication: string; dosage: string; time: string; frequency: string; prescribingDoctor: string; notes: string }[]> = {};
  for (const r of rows) {
    const key = r["User"] || r["Client"] || r["Name"] || "unknown";
    if (!byUser[key]) byUser[key] = [];
    byUser[key].push({
      medication: r["Medication"] || "",
      dosage: r["Dosage"] || "",
      time: r["Time"] || "",
      frequency: r["Frequency"] || "Daily",
      prescribingDoctor: r["Prescribing Doctor"] || "",
      notes: r["Notes"] || "",
    });
  }
  for (const [name, meds] of Object.entries(byUser)) {
    const user = await prisma.user.findFirst({ where: { name } });
    if (!user) continue;
    await prisma.userMeds.upsert({
      where: { userId: user.id },
      create: { userId: user.id, schedule: { medications: meds } },
      update: { schedule: { medications: meds } },
    });
    count += meds.length;
  }
  return count;
}

const IMPORTERS: Record<string, (rows: ParsedRow[]) => Promise<number>> = {
  meals: importMeals,
  activities: importActivities,
  schedule: importSchedule,
  staff: importStaff,
  guidelines: importGuidelines,
  houserules: importHouseRules,
  emergency: importEmergency,
  housekeeping: importHousekeeping,
  laundry: importLaundry,
  medications: importMedications,
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const table = formData.get("table") as string | null;
    const clearExisting = formData.get("clearExisting") === "true";

    if (!file || !table) {
      return NextResponse.json({ error: "Missing file or table" }, { status: 400 });
    }

    const importer = IMPORTERS[table];
    if (!importer) {
      return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 });
    }

    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });
    }

    // Validate CSV headers against expected columns for the target table
    const validation = validateHeaders(headers, table);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Column mismatch — your CSV doesn't match the target table",
          expected: EXPECTED_HEADERS[table] || [],
          received: headers,
          missing: validation.missing,
          unexpected: validation.unexpected,
        },
        { status: 400 }
      );
    }

    if (clearExisting) {
      const prisma = getPrisma();
      const deleteMap: Record<string, () => Promise<any>> = {
        meals: () => prisma.mealTemplate.deleteMany(),
        activities: () => prisma.activityTemplate.deleteMany(),
        schedule: () => prisma.dailyScheduleTemplate.deleteMany(),
        staff: () => prisma.staffMember.deleteMany(),
        guidelines: () => prisma.guideline.deleteMany(),
        houserules: () => prisma.houseRule.deleteMany(),
        emergency: () => prisma.emergencyContact.deleteMany(),
        housekeeping: () => prisma.housekeepingSchedule.deleteMany(),
        laundry: () => prisma.laundrySchedule.deleteMany(),
        medications: () => prisma.userMeds.deleteMany(),
      };
      if (deleteMap[table]) await deleteMap[table]();
    }

    const count = await importer(rows);

    return NextResponse.json({ success: true, imported: count, total: rows.length });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
