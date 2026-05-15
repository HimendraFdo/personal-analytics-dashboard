import { NextRequest } from "next/server";
import { EntryCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-response";
import { serializeEntryJson } from "@/lib/entries";
import { handleApiError } from "@/lib/handle-api-error";
import { parseEntryDate, updateEntrySchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateEntrySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid request body",
        "VALIDATION_ERROR",
        400
      );
    }

    const existing = await prisma.entry.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("Entry not found", "NOT_FOUND", 404);
    }

    const { title, value, category, date, note } = parsed.data;

    const entry = await prisma.entry.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(value !== undefined ? { value } : {}),
        ...(category !== undefined
          ? { category: category as EntryCategory }
          : {}),
        ...(date !== undefined ? { date: parseEntryDate(date) } : {}),
        ...(note !== undefined ? { note } : {}),
      },
    });

    return Response.json(serializeEntryJson(entry));
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid date") {
      return jsonError("Invalid date", "VALIDATION_ERROR", 400);
    }
    return handleApiError(error, "Failed to update entry");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await prisma.entry.findUnique({ where: { id } });

    if (!existing) {
      return jsonError("Entry not found", "NOT_FOUND", 404);
    }

    await prisma.entry.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, "Failed to delete entry");
  }
}

export async function GET() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}

export async function POST() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}
