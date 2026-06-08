import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  statementExtractionSchema,
} from "./extraction-schema";
import { extractTextFromPdf } from "./pdf-text";
import type { IntakeResult, StatementExtraction } from "./types";

const IMAGE_MAX_PX = 1500;
const IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;

async function resizeImageIfNeeded(bytes: Buffer, mimeType: string): Promise<{ bytes: Buffer; mimeType: string }> {
  try {
    const image = sharp(bytes);
    const meta = await image.metadata();
    const { width = 0, height = 0 } = meta;

    const needsResize = width > IMAGE_MAX_PX || height > IMAGE_MAX_PX || bytes.length > IMAGE_MAX_BYTES;
    if (!needsResize) return { bytes, mimeType };

    const resized = await image
      .resize(IMAGE_MAX_PX, IMAGE_MAX_PX, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    return { bytes: resized, mimeType: "image/jpeg" };
  } catch {
    return { bytes, mimeType };
  }
}

function createStatementReaderPrompt(referenceDate = new Date()) {
  const referenceYear = referenceDate.getFullYear();

  return [
    "Extract only bank transactions from the attached statement.",
    `Use ${referenceYear} as the year for bank-app screenshots or statements that show day and month but omit the year.`,
    "Do not infer missing merchants, descriptions, or amounts.",
    "Do not infer dates unless the row has a visible day and month, or a visible statement period establishes the year.",
    "Return uncertain rows with lower confidence and warnings.",
    "Treat debits and card purchases as spending.",
    "Treat refunds, credits, transfers, and deposits as non-spending unless the statement clearly marks them as fees or purchases.",
    "Respond with valid JSON matching the schema exactly.",
  ].join("\n");
}

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const geminiResponseSchema = {
  type: "object",
  properties: {
    accountName: { type: "string", nullable: true },
    statementPeriodStart: { type: "string", nullable: true },
    statementPeriodEnd: { type: "string", nullable: true },
    currency: { type: "string" },
    transactions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sourceRowId: { type: "string" },
          date: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          amount: { type: "number", nullable: true },
          currency: { type: "string", nullable: true },
          direction: { type: "string", enum: ["debit", "credit", "unknown"] },
          confidence: { type: "number" },
          warnings: { type: "array", items: { type: "string" } },
        },
        required: ["sourceRowId", "date", "description", "amount", "currency", "direction", "confidence", "warnings"],
      },
    },
    warnings: { type: "array", items: { type: "string" } },
  },
  required: ["accountName", "statementPeriodStart", "statementPeriodEnd", "currency", "transactions", "warnings"],
};

async function readStatementFixture(
  fixturePath: string
): Promise<StatementExtraction> {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.MONEY_IMPORT_EXTRACT_FIXTURE_ALLOW_PRODUCTION !== "true"
  ) {
    throw new Error("Statement extraction fixture mode is not allowed in production");
  }

  const resolvedPath = path.resolve(process.cwd(), fixturePath);
  const fixture = JSON.parse(await readFile(resolvedPath, "utf8"));
  const parsed = statementExtractionSchema.safeParse(fixture);

  if (!parsed.success) {
    throw new Error("Statement extraction fixture returned invalid data");
  }

  return parsed.data;
}

export async function readStatement(
  intake: IntakeResult
): Promise<StatementExtraction> {
  const fixturePath = process.env.MONEY_IMPORT_EXTRACT_FIXTURE_PATH;
  if (fixturePath) {
    return readStatementFixture(fixturePath);
  }

  const client = getGeminiClient();
  const model = process.env.GEMINI_MONEY_IMPORT_MODEL ?? "gemini-2.0-flash";
  const prompt = createStatementReaderPrompt();

  let responseText: string;
  try {
    const geminiModel = client.getGenerativeModel({
      model,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema as any,
      },
    });

    if (intake.fileKind === "pdf") {
      const extractedText = extractTextFromPdf(intake.bytes);

      if (extractedText) {
        const contents = [prompt, "Use this locally extracted PDF statement text to extract transactions.", extractedText].join("\n\n");
        const result = await geminiModel.generateContent(contents);
        responseText = result.response.text();
      } else {
        const result = await geminiModel.generateContent([
          { text: prompt },
          { inlineData: { data: intake.bytes.toString("base64"), mimeType: "application/pdf" } },
        ]);
        responseText = result.response.text();
      }
    } else {
      const resized = await resizeImageIfNeeded(intake.bytes, intake.mimeType);
      const result = await geminiModel.generateContent([
        { text: prompt },
        { inlineData: { data: resized.bytes.toString("base64"), mimeType: resized.mimeType } },
      ]);
      responseText = result.response.text();
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown provider error";
    throw new Error(`Statement extraction provider request failed: ${message}`);
  }

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(responseText);
  } catch {
    throw new Error("Statement extraction returned invalid data");
  }

  const parsed = statementExtractionSchema.safeParse(rawJson);
  if (!parsed.success) {
    throw new Error("Statement extraction returned invalid data");
  }

  return parsed.data;
}
