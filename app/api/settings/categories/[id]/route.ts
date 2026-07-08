import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withRlsUserContext } from "@/lib/prisma";
import { jsonError } from "@/lib/api-response";
import { findDuplicateName, serializeCategory } from "@/lib/categories";
import { RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { validateMutationRequest } from "@/lib/request-security";
import { categoryIdSchema, categoryMutationSchema } from "@/lib/validation";

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
      ...RATE_LIMITS.categoriesWrite,
      userId,
    });
    if (limited) {
      return limited;
    }

    const { id: rawId } = await context.params;
    const idResult = categoryIdSchema.safeParse(rawId);

    if (!idResult.success) {
      return jsonError("Invalid category id", "VALIDATION_ERROR", 400);
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

    const id = idResult.data;
    const name = parsed.data.name;
    const result = await withRlsUserContext(userId, async (tx) => {
      const existing = await tx.category.findFirst({ where: { id, userId } });
      if (!existing) {
        return { error: "not_found" as const };
      }

      if (existing.name === name) {
        return { category: existing };
      }

      const categories = await tx.category.findMany({ where: { userId } });
      if (findDuplicateName(categories, name, id)) {
        return { error: "duplicate" as const };
      }

      const category = await tx.category.update({
        where: { id },
        data: { name },
      });

      // Renaming follows through to entries so history stays grouped
      await tx.entry.updateMany({
        where: { userId, category: existing.name },
        data: { category: name },
      });

      return { category };
    });

    if ("error" in result) {
      if (result.error === "not_found") {
        return jsonError("Category not found", "NOT_FOUND", 404);
      }
      return jsonError("Category already exists", "CONFLICT", 409);
    }

    return Response.json(serializeCategory(result.category));
  } catch {
    return jsonError("Failed to update category", "INTERNAL_ERROR", 500);
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
      ...RATE_LIMITS.categoriesWrite,
      userId,
    });
    if (limited) {
      return limited;
    }

    const { id: rawId } = await context.params;
    const idResult = categoryIdSchema.safeParse(rawId);

    if (!idResult.success) {
      return jsonError("Invalid category id", "VALIDATION_ERROR", 400);
    }

    const id = idResult.data;
    const result = await withRlsUserContext(userId, async (tx) => {
      const existing = await tx.category.findFirst({ where: { id, userId } });
      if (!existing) {
        return { error: "not_found" as const };
      }

      const count = await tx.category.count({ where: { userId } });
      if (count <= 1) {
        return { error: "last" as const };
      }

      await tx.category.delete({ where: { id } });
      return { deleted: true };
    });

    if ("error" in result) {
      if (result.error === "not_found") {
        return jsonError("Category not found", "NOT_FOUND", 404);
      }
      return jsonError(
        "You need at least one category",
        "VALIDATION_ERROR",
        400
      );
    }

    return new Response(null, { status: 204 });
  } catch {
    return jsonError("Failed to delete category", "INTERNAL_ERROR", 500);
  }
}

export async function GET() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}

export async function POST() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}
