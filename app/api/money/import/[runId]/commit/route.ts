import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { withRlsUserContext } from "@/lib/prisma";
import { jsonError } from "@/lib/api-response";
import { RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { validateMutationRequest } from "@/lib/request-security";
import { commitMoneyImportDrafts } from "@/lib/money-import/commit";

const draftSchema = z
  .object({
    id: z.string().uuid(),
    date: z.string().trim().min(1).max(20),
    title: z.string().trim().min(1).max(200),
    value: z.coerce.number().positive().finite(),
    category: z.literal("Finance"),
    note: z.string().max(2000),
    confidence: z.coerce.number().min(0).max(1),
    duplicateCandidate: z.boolean(),
    warnings: z.array(z.string().max(300)),
  })
  .strict();

const commitRequestSchema = z
  .object({
    draftIds: z.array(z.string().uuid()).min(1).max(200),
    drafts: z.array(draftSchema).min(1).max(200),
  })
  .strict();

export async function POST(
  request: NextRequest,
  _context: { params: Promise<{ runId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const securityError = validateMutationRequest(request, {
      requireJson: true,
      maxContentLengthBytes: 128 * 1024,
    });
    if (securityError) {
      return securityError;
    }

    const limited = await rateLimitResponse({
      ...RATE_LIMITS.moneyImportCommit,
      userId,
    });
    if (limited) {
      return limited;
    }

    const parsed = commitRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid request body",
        "VALIDATION_ERROR",
        400
      );
    }

    const result = await withRlsUserContext(userId, async (tx) => {
      return commitMoneyImportDrafts({
        tx,
        userId,
        drafts: parsed.data.drafts,
        draftIds: parsed.data.draftIds,
      });
    });

    return Response.json(result);
  } catch {
    return jsonError("Failed to import selected rows", "INTERNAL_ERROR", 500);
  }
}

export async function GET() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}
