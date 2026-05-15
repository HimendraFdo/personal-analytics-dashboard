import { NextRequest } from "next/server";
import { EntryCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-response";
import { serializeEntryJson } from "@/lib/entries";
import {
  createEntrySchema,
  parseEntryDate,
  sortSchema,
} from "@/lib/validation";
import { handleApiError } from "@/lib/handle-api-error";
import { ENTRY_CATEGORIES } from "@/types/entry";

function getOrderBy(sort: string): Prisma.EntryOrderByWithRelationInput {
  switch (sort) {
    case "date_asc":
      return { date: "asc" };
    case "value_desc":
      return { value: "desc" };
    case "value_asc":
      return { value: "asc" };
    case "date_desc":
    default:
      return { date: "desc" };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const sortResult = sortSchema.safeParse(
      searchParams.get("sort") ?? undefined
    );

    if (!sortResult.success) {
      return jsonError("Invalid sort parameter", "VALIDATION_ERROR", 400);
    }

    if (
      category &&
      !ENTRY_CATEGORIES.includes(category as (typeof ENTRY_CATEGORIES)[number])
    ) {
      return jsonError("Invalid category", "VALIDATION_ERROR", 400);
    }

    const entries = await prisma.entry.findMany({
      where: category
        ? { category: category as EntryCategory }
        : undefined,
      orderBy: getOrderBy(sortResult.data),
    });

    return Response.json({
      entries: entries.map(serializeEntryJson),
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch entries");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createEntrySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid request body",
        "VALIDATION_ERROR",
        400
      );
    }

    const { title, value, category, date, note } = parsed.data;

    const entry = await prisma.entry.create({
      data: {
        title,
        value,
        category: category as EntryCategory,
        date: parseEntryDate(date),
        note: note ?? "",
      },
    });

    return Response.json(serializeEntryJson(entry), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid date") {
      return jsonError("Invalid date", "VALIDATION_ERROR", 400);
    }
    return handleApiError(error, "Failed to create entry");
  }
}

export async function PATCH() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}

export async function DELETE() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}
