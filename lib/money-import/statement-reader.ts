import OpenAI, { toFile } from "openai";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseInputContent } from "openai/resources/responses/responses";
import {
  statementExtractionProviderSchema,
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

type InputContentResult = [ResponseInputContent[], string | null];

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
    "Use the exact schema.",
  ].join("\n");
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function isFileUploadPermissionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("api.files.write") ||
    error.message.includes("Missing scopes") ||
    error.message.includes("insufficient permissions")
  );
}

async function createInputContent(
  client: OpenAI,
  intake: IntakeResult
): Promise<InputContentResult> {
  const base64 = intake.bytes.toString("base64");
  const prompt = createStatementReaderPrompt();

  if (intake.fileKind === "pdf") {
    const extractedText = extractTextFromPdf(intake.bytes);
    if (extractedText) {
      return [
        [
          { type: "input_text" as const, text: prompt },
          {
            type: "input_text" as const,
            text: [
              "Use this locally extracted PDF statement text to extract transactions.",
              extractedText,
            ].join("\n\n"),
          },
        ],
        null,
      ];
    }

    try {
      const uploadedFile = await client.files.create({
        file: await toFile(intake.bytes, intake.originalFileName, {
          type: intake.mimeType,
        }),
        purpose: "user_data",
        expires_after: {
          anchor: "created_at",
          seconds: 3600,
        },
      });

      return [
        [
          { type: "input_text" as const, text: prompt },
          {
            type: "input_file" as const,
            file_id: uploadedFile.id,
          },
        ],
        uploadedFile.id,
      ];
    } catch (error) {
      if (!isFileUploadPermissionError(error)) {
        throw error;
      }
    }

    return [
      [
        { type: "input_text" as const, text: prompt },
        {
          type: "input_file" as const,
          filename: intake.originalFileName,
          file_data: `data:${intake.mimeType};base64,${base64}`,
        },
      ],
      null,
    ];
  }

  const resized = await resizeImageIfNeeded(intake.bytes, intake.mimeType);
  const resizedBase64 = resized.bytes.toString("base64");

  return [
    [
      { type: "input_text" as const, text: prompt },
      {
        type: "input_image" as const,
        detail: "high" as const,
        image_url: `data:${resized.mimeType};base64,${resizedBase64}`,
      },
    ],
    null,
  ];
}

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

  const client = getOpenAIClient();
  let uploadedFileId: string | null = null;
  let response;
  try {
    const [content, fileId] = await createInputContent(client, intake);
    uploadedFileId = fileId;

    response = await client.responses.parse({
      model: process.env.OPENAI_MONEY_IMPORT_MODEL ?? "gpt-4o",
      input: [
        {
          role: "user",
          content,
        },
      ],
      text: {
        format: zodTextFormat(
          statementExtractionProviderSchema,
          "statement_extraction"
        ),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown provider error";
    throw new Error(`Statement extraction provider request failed: ${message}`);
  } finally {
    if (uploadedFileId) {
      await client.files.delete(uploadedFileId).catch(() => undefined);
    }
  }

  const parsed = statementExtractionSchema.safeParse(response.output_parsed);
  if (!parsed.success) {
    throw new Error("Statement extraction returned invalid data");
  }

  return parsed.data;
}
