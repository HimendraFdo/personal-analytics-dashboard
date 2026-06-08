import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { withRlsUserContext } from "@/lib/prisma";
import { jsonError } from "@/lib/api-response";
import { RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { validateMutationRequest } from "@/lib/request-security";
import { commitMoneyImportDrafts } from "@/lib/money-import/commit";
import {
  deleteMoneyImportRun,
  getMoneyImportRun,
} from "@/lib/money-import/store";

const commitRequestSchema = z
  .object({
    draftIds: z.array(z.string().uuid()).min(1).max(200),
    drafts: z
      .array(
        z
          .object({
            id: z.string().uuid(),
            date: z.string().trim().min(1).max(20).optional(),
            title: z.string().trim().min(1).max(200).optional(),
            value: z.coerce.number().positive().finite().optional(),
            category: z.literal("Finance").optional(),
            note: z.string().max(2000).optional(),
            confidence: z.coerce.number().min(0).max(1).optional(),
            duplicateCandidate: z.boolean().optional(),
            warnings: z.array(z.string().max(300)).optional(),
          })
          .strict()
      )
      .max(200)
      .optional(),
  })
  .strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
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

    const { runId } = await params;
    const result = await withRlsUserContext(userId, async (tx) => {
      const run = await getMoneyImportRun(tx, runId, userId);
      if (!run) {
        return null;
      }

      const draftUpdates = new Map(
        (parsed.data.drafts ?? []).map((draft) => [draft.id, draft])
      );
      const drafts = run.drafts.map((draft) => {
        const update = draftUpdates.get(draft.id);
        return update
          ? { ...draft, ...update, category: "Finance" as const }
          : draft;
      });

      const commitResult = await commitMoneyImportDrafts({
        tx,
        userId,
        drafts,
        draftIds: parsed.data.draftIds,
      });

      await deleteMoneyImportRun(tx, runId, userId);
      return commitResult;
    });

    if (!result) {
      return jsonError("Import run not found", "NOT_FOUND", 404);
    }

    return Response.json(result);
  } catch {
    return jsonError("Failed to import selected rows", "INTERNAL_ERROR", 500);
  }
}

export async function GET() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}
