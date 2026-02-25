import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getPrisma } from "@/lib/prisma";
import { ACTION_TABLE_MAP, OPENAI_MODEL, OPENAI_TEMPERATURE } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const prisma = getPrisma();
    const body = await request.json();
    const { actionId, prompt } = body;

    if (!actionId || !prompt) {
      return NextResponse.json({ error: "actionId and prompt are required" }, { status: 400 });
    }

    const tableInfo = ACTION_TABLE_MAP[actionId];
    if (!tableInfo) {
      return NextResponse.json({
        error: `Smart update not supported for ${actionId}. Use raw override instead.`,
      }, { status: 400 });
    }

    // Get current data for context
    let currentData: unknown[] = [];
    try {
      switch (tableInfo.table) {
        case "MealTemplate":
          currentData = await prisma.mealTemplate.findMany();
          break;
        case "ActivityTemplate":
          currentData = await prisma.activityTemplate.findMany();
          break;
        case "Guideline":
          currentData = await prisma.guideline.findMany();
          break;
        case "HouseRule":
          currentData = await prisma.houseRule.findMany();
          break;
      }
    } catch { /* ignore - proceed without context */ }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a database assistant. The user wants to update ${tableInfo.table} records.

Table schema: ${tableInfo.description}

Current records in the database:
${JSON.stringify(currentData, null, 2)}

Based on the user's instruction, return a JSON object with:
- "action": "replace_all" | "add" | "update" | "delete"
- "records": array of record objects matching the schema fields

For "replace_all", return all records that should exist after the change.
For "add", return only the new records to add.
For "update", return records with their id and updated fields.
For "delete", return records with their id.

Return ONLY valid JSON, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: OPENAI_TEMPERATURE,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let parsed: { action: string; records: Record<string, unknown>[] };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON", raw: responseText }, { status: 500 });
    }

    // Apply changes to database
    let result = { action: parsed.action, count: 0, summary: "" };

    switch (tableInfo.table) {
      case "MealTemplate":
        result = await applyMealChanges(prisma, parsed);
        break;
      case "ActivityTemplate":
        result = await applyActivityChanges(prisma, parsed);
        break;
      case "Guideline":
        result = await applyGuidelineChanges(prisma, parsed);
        break;
      case "HouseRule":
        result = await applyHouseRuleChanges(prisma, parsed);
        break;
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Smart update failed:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Smart update failed",
    }, { status: 500 });
  }
}

async function applyMealChanges(prisma: any, parsed: { action: string; records: any[] }) {
  const { action, records } = parsed;
  let count = 0;

  if (action === "replace_all") {
    await prisma.mealTemplate.deleteMany();
    for (const r of records) {
      await prisma.mealTemplate.create({
        data: {
          mealType: r.mealType || "meal",
          items: Array.isArray(r.items) ? r.items : [],
          startTime: r.startTime || null,
          endTime: r.endTime || null,
          daysOfWeek: Array.isArray(r.daysOfWeek) ? r.daysOfWeek : [],
          notes: r.notes || null,
        },
      });
      count++;
    }
    return { action, count, summary: `Replaced all meals with ${count} new entries` };
  }

  if (action === "add") {
    for (const r of records) {
      await prisma.mealTemplate.create({
        data: {
          mealType: r.mealType || "meal",
          items: Array.isArray(r.items) ? r.items : [],
          startTime: r.startTime || null,
          endTime: r.endTime || null,
          daysOfWeek: Array.isArray(r.daysOfWeek) ? r.daysOfWeek : [],
          notes: r.notes || null,
        },
      });
      count++;
    }
    return { action, count, summary: `Added ${count} new meals` };
  }

  if (action === "delete") {
    for (const r of records) {
      if (r.id) {
        await prisma.mealTemplate.delete({ where: { id: r.id } }).catch(() => {});
        count++;
      }
    }
    return { action, count, summary: `Deleted ${count} meals` };
  }

  return { action, count: 0, summary: "No changes made" };
}

async function applyActivityChanges(prisma: any, parsed: { action: string; records: any[] }) {
  const { action, records } = parsed;
  let count = 0;

  if (action === "replace_all") {
    await prisma.activityTemplate.deleteMany();
    for (const r of records) {
      await prisma.activityTemplate.create({
        data: {
          name: r.name || "Activity",
          description: r.description || null,
          startTime: r.startTime || "00:00",
          endTime: r.endTime || "00:00",
          location: r.location || null,
          daysOfWeek: Array.isArray(r.daysOfWeek) ? r.daysOfWeek : [],
          notes: r.notes || null,
        },
      });
      count++;
    }
    return { action, count, summary: `Replaced all activities with ${count} new entries` };
  }

  if (action === "add") {
    for (const r of records) {
      await prisma.activityTemplate.create({
        data: {
          name: r.name || "Activity",
          description: r.description || null,
          startTime: r.startTime || "00:00",
          endTime: r.endTime || "00:00",
          location: r.location || null,
          daysOfWeek: Array.isArray(r.daysOfWeek) ? r.daysOfWeek : [],
          notes: r.notes || null,
        },
      });
      count++;
    }
    return { action, count, summary: `Added ${count} new activities` };
  }

  if (action === "delete") {
    for (const r of records) {
      if (r.id) {
        await prisma.activityTemplate.delete({ where: { id: r.id } }).catch(() => {});
        count++;
      }
    }
    return { action, count, summary: `Deleted ${count} activities` };
  }

  return { action, count: 0, summary: "No changes made" };
}

async function applyGuidelineChanges(prisma: any, parsed: { action: string; records: any[] }) {
  const { action, records } = parsed;
  let count = 0;

  if (action === "replace_all") {
    await prisma.guideline.deleteMany();
    for (const r of records) {
      await prisma.guideline.create({
        data: { title: r.title || "Guideline", content: r.content || "", category: r.category || null },
      });
      count++;
    }
    return { action, count, summary: `Replaced all guidelines with ${count} new entries` };
  }

  if (action === "add") {
    for (const r of records) {
      await prisma.guideline.create({
        data: { title: r.title || "Guideline", content: r.content || "", category: r.category || null },
      });
      count++;
    }
    return { action, count, summary: `Added ${count} new guidelines` };
  }

  if (action === "delete") {
    for (const r of records) {
      if (r.id) { await prisma.guideline.delete({ where: { id: r.id } }).catch(() => {}); count++; }
    }
    return { action, count, summary: `Deleted ${count} guidelines` };
  }

  return { action, count: 0, summary: "No changes made" };
}

async function applyHouseRuleChanges(prisma: any, parsed: { action: string; records: any[] }) {
  const { action, records } = parsed;
  let count = 0;

  if (action === "replace_all") {
    await prisma.houseRule.deleteMany();
    for (const r of records) {
      await prisma.houseRule.create({
        data: { title: r.title || "Rule", content: r.content || "", category: r.category || null },
      });
      count++;
    }
    return { action, count, summary: `Replaced all house rules with ${count} new entries` };
  }

  if (action === "add") {
    for (const r of records) {
      await prisma.houseRule.create({
        data: { title: r.title || "Rule", content: r.content || "", category: r.category || null },
      });
      count++;
    }
    return { action, count, summary: `Added ${count} new house rules` };
  }

  if (action === "delete") {
    for (const r of records) {
      if (r.id) { await prisma.houseRule.delete({ where: { id: r.id } }).catch(() => {}); count++; }
    }
    return { action, count, summary: `Deleted ${count} house rules` };
  }

  return { action, count: 0, summary: "No changes made" };
}

