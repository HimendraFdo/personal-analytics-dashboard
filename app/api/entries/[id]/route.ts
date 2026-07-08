import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withRlsUserContext } from "@/lib/prisma";
import { jsonError } from "@/lib/api-response";
import { serializeEntryJson } from "@/lib/entries";
import { RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { validateMutationRequest } from "@/lib/request-security";
import {
  entryIdSchema,
  parseEntryDate,
  updateEntrySchema,
} from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
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
      ...RATE_LIMITS.entriesUpdate,
      userId,
    });
    if (limited) {
      return limited;
    }

    const { id: rawId } = await context.params;
    const idResult = entryIdSchema.safeParse(rawId);

    if (!idResult.success) {
      return jsonError("Invalid entry id", "VALIDATION_ERROR", 400);
    }

    const id = idResult.data;
    const body = await request.json();
    const parsed = updateEntrySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid request body",
        "VALIDATION_ERROR",
        400
      );
    }

    const entry = await withRlsUserContext(userId, async (tx) => {
      const existing = await tx.entry.findFirst({ where: { id, userId } });
      if (!existing) {
        return null;
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
      const nextMetricType = metricType ?? existing.metricType;
      const nutritionData =
        nextMetricType === "calories"
          ? {
              ...(foodName !== undefined ? { foodName } : {}),
              ...(portionGrams !== undefined ? { portionGrams } : {}),
              ...(proteinGrams !== undefined ? { proteinGrams } : {}),
              ...(carbsGrams !== undefined ? { carbsGrams } : {}),
              ...(fatGrams !== undefined ? { fatGrams } : {}),
              ...(foodSource !== undefined ? { foodSource } : {}),
            }
          : {
              foodName: null,
              portionGrams: null,
              proteinGrams: null,
              carbsGrams: null,
              fatGrams: null,
              foodSource: null,
            };

      const result = await tx.entry.updateMany({
        where: { id, userId },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(value !== undefined ? { value } : {}),
          ...(metricType !== undefined ? { metricType } : {}),
          ...(category !== undefined ? { category } : {}),
          ...(date !== undefined ? { date: parseEntryDate(date) } : {}),
          ...(note !== undefined ? { note } : {}),
          ...nutritionData,
        },
      });

      if (result.count === 0) {
        return null;
      }

      return tx.entry.findFirst({ where: { id, userId } });
    });

    if (!entry) {
      return jsonError("Entry not found", "NOT_FOUND", 404);
    }

    return Response.json(serializeEntryJson(entry));
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid date") {
      return jsonError("Invalid date", "VALIDATION_ERROR", 400);
    }
    return jsonError("Failed to update entry", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const securityError = validateMutationRequest(request);
    if (securityError) {
      return securityError;
    }

    const limited = await rateLimitResponse({
      ...RATE_LIMITS.entriesDelete,
      userId,
    });
    if (limited) {
      return limited;
    }

    const { id: rawId } = await context.params;
    const idResult = entryIdSchema.safeParse(rawId);

    if (!idResult.success) {
      return jsonError("Invalid entry id", "VALIDATION_ERROR", 400);
    }

    const id = idResult.data;
    const result = await withRlsUserContext(userId, (tx) =>
      tx.entry.deleteMany({ where: { id, userId } })
    );

    if (result.count === 0) {
      return jsonError("Entry not found", "NOT_FOUND", 404);
    }

    return new Response(null, { status: 204 });
  } catch {
    return jsonError("Failed to delete entry", "INTERNAL_ERROR", 500);
  }
}

export async function GET() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}

export async function POST() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}
