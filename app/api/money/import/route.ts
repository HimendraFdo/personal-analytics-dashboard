import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withRlsUserContext } from "@/lib/prisma";
import { jsonError } from "@/lib/api-response";
import { RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { validateMutationRequest } from "@/lib/request-security";
import { intakeStatementFile } from "@/lib/money-import/intake";
import { readStatement } from "@/lib/money-import/statement-reader";
import { normalizeStatementExtraction } from "@/lib/money-import/normalize";
import { reviewMoneyImportDrafts } from "@/lib/money-import/review";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const securityError = validateMutationRequest(request, {
      maxContentLengthBytes: 12 * 1024 * 1024,
    });
    if (securityError) {
      return securityError;
    }

    const limited = await rateLimitResponse({
      ...RATE_LIMITS.moneyImportExtract,
      userId,
    });
    if (limited) {
      return limited;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Statement file is required", "VALIDATION_ERROR", 400);
    }

    const intake = await intakeStatementFile(file);
    const extraction = await readStatement(intake);
    const { drafts, rejectedRows } = normalizeStatementExtraction(extraction);
    const reviewed = await withRlsUserContext(userId, (tx) =>
      reviewMoneyImportDrafts(tx, userId, drafts)
    );
    const warnings = [
      ...extraction.warnings,
      ...rejectedRows.map(
        (row) => `Rejected row ${row.sourceRowId}: ${row.reason}`
      ),
    ];

    return Response.json({
      runId: intake.runId,
      status: "requires_review",
      fileName: intake.originalFileName,
      summary: reviewed.summary,
      drafts: reviewed.drafts,
      warnings,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import statement";

    if (
      message === "Unsupported statement file type" ||
      message === "Statement file is empty" ||
      message === "Statement file is too large" ||
      message === "Statement file type does not match content"
    ) {
      return jsonError(message, "VALIDATION_ERROR", 400);
    }

    if (message === "OpenAI API key is not configured") {
      return jsonError(
        "Statement extraction is not configured. Set OPENAI_API_KEY and restart the app, or set MONEY_IMPORT_EXTRACT_FIXTURE_PATH for local QA.",
        "CONFIGURATION_ERROR",
        503
      );
    }

    if (message === "Statement extraction fixture mode is not allowed in production") {
      return jsonError(
        "Statement extraction is configured for local fixture mode in production. Remove MONEY_IMPORT_EXTRACT_FIXTURE_PATH from production or explicitly enable production fixture mode.",
        "CONFIGURATION_ERROR",
        503
      );
    }

    if (message.startsWith("Statement extraction provider request failed:")) {
      console.error("[money-import] provider error:", error);
      return jsonError(
        "Statement extraction failed. Please try again later.",
        "EXTRACTION_PROVIDER_ERROR",
        502
      );
    }

    if (message === "Statement extraction returned invalid data") {
      console.error("[money-import] invalid extraction data:", error);
      return jsonError(
        "Statement extraction returned unexpected data. Please try again.",
        "EXTRACTION_VALIDATION_ERROR",
        502
      );
    }

    console.error("[money-import] unexpected error:", error);
    return jsonError("Failed to extract statement", "INTERNAL_ERROR", 500);
  }
}

export async function GET() {
  return jsonError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
}
