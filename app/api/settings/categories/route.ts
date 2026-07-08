import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withRlsUserContext } from "@/lib/prisma";
import { jsonError } from "@/lib/api-response";
import {
  findDuplicateName,
  listCategoriesWithDefaults,
  MAX_CATEGORIES_PER_USER,
  serializeCategory,
} from "@/lib/categories";
import { RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { validateMutationRequest } from "@/lib/request-security";
import { categoryMutationSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const limited = await rateLimitResponse({
      ...RATE_LIMITS.categoriesRead,
      userId,
    });
    if (limited) {
      return limited;
    }

    const categories = await withRlsUserContext(userId, (tx) =>
      listCategoriesWithDefaults(tx, userId)
    );

    return Response.json({
      categories: categories.map(serializeCategory),
    });
  } catch {
    return jsonError("Failed to fetch categories", "INTERNAL_ERROR", 500);
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
      ...RATE_LIMITS.categoriesWrite,
      userId,
    });
    if (limited) {
      return limited;
    }

    const body = await request.json();
    const parsed = categoryMutationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid request body",
        "VALIDATION_ERROR",
        400
      );
    }

    const name = parsed.data.name;
    const result = await withRlsUserContext(userId, async (tx) => {
      const categories = await listCategoriesWithDefaults(tx, userId);

      if (categories.length >= MAX_CATEGORIES_PER_USER) {
        return { error: "limit" as const };
      }

      if (findDuplicateName(categories, name)) {
        return { error: "duplicate" as const };
      }

      const category = await tx.category.create({
        data: { userId, name },
      });
      return { category };
    });

    if ("error" in result) {
      if (result.error === "limit") {
        return jsonError(
          `You can have at most ${MAX_CATEGORIES_PER_USER} categories`,
          "VALIDATION_ERROR",
          400
        );
      }
      return jsonError("Category already exists", "CONFLICT", 409);
    }

    return Response.json(serializeCategory(result.category), { status: 201 });
  } catch {
    return jsonError("Failed to create category", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}

export async function DELETE() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}
