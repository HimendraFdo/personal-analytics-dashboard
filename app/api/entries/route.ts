import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { withRlsUserContext } from "@/lib/prisma";
import { jsonError } from "@/lib/api-response";
import { serializeEntryJson } from "@/lib/entries";
import { parseMetricType } from "@/lib/metrics";
import { RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { validateMutationRequest } from "@/lib/request-security";
import {
  categoryNameSchema,
  createEntrySchema,
  parseEntryDate,
  sortSchema,
} from "@/lib/validation";
import { DEFAULT_ENTRY_CATEGORIES } from "@/types/entry";

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
    const { userId } = await auth();

    if (!userId) {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const limited = await rateLimitResponse({
      ...RATE_LIMITS.entriesRead,
      userId,
    });
    if (limited) {
      return limited;
    }

    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const metricType = parseMetricType(searchParams.get("metric"));
    const sortResult = sortSchema.safeParse(
      searchParams.get("sort") ?? undefined
    );

    if (!sortResult.success) {
      return jsonError("Invalid sort parameter", "VALIDATION_ERROR", 400);
    }

    if (category && !categoryNameSchema.safeParse(category).success) {
      return jsonError("Invalid category", "VALIDATION_ERROR", 400);
    }

    const entries = await withRlsUserContext(userId, (tx) =>
      tx.entry.findMany({
        where: {
          userId,
          metricType,
          ...(category ? { category } : {}),
        },
        orderBy: getOrderBy(sortResult.data),
      })
    );

    return Response.json({
      entries: entries.map(serializeEntryJson),
    });
  } catch {
    return jsonError("Failed to fetch entries", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const securityError = validateMutationRequest(request, {
      requireJson: true,
    });
    if (securityError) {
      return securityError;
    }

    const limited = await rateLimitResponse({
      ...RATE_LIMITS.entriesCreate,
      userId,
    });
    if (limited) {
      return limited;
    }

    const body = await request.json();
    const parsed = createEntrySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid request body",
        "VALIDATION_ERROR",
        400
      );
    }

    const {
      title,
      value,
      metricType,
      category,
      date,
      note,
      foodName,
      portionGrams,
      proteinGrams,
      carbsGrams,
      fatGrams,
      foodSource,
    } = parsed.data;
    const nutritionData =
      metricType === "calories"
        ? {
            foodName: foodName ?? null,
            portionGrams: portionGrams ?? null,
            proteinGrams: proteinGrams ?? null,
            carbsGrams: carbsGrams ?? null,
            fatGrams: fatGrams ?? null,
            foodSource: foodSource ?? null,
          }
        : {
            foodName: null,
            portionGrams: null,
            proteinGrams: null,
            carbsGrams: null,
            fatGrams: null,
            foodSource: null,
          };

    const entry = await withRlsUserContext(userId, (tx) =>
      tx.entry.create({
        data: {
          userId,
          title,
          value,
          metricType,
          category:
            category ??
            DEFAULT_ENTRY_CATEGORIES[
              metricType as keyof typeof DEFAULT_ENTRY_CATEGORIES
            ],
          date: parseEntryDate(date),
          note: note ?? "",
          ...nutritionData,
        },
      })
    );

    return Response.json(serializeEntryJson(entry), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid date") {
      return jsonError("Invalid date", "VALIDATION_ERROR", 400);
    }
    return jsonError("Failed to create entry", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}

export async function DELETE() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}
