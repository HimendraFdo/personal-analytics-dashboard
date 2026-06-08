import OpenAI from "openai";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { zodTextFormat } from "openai/helpers/zod";
import { statementExtractionSchema } from "./extraction-schema";
import type { IntakeResult, StatementExtraction } from "./types";

const STATEMENT_READER_PROMPT = [
  "Extract only bank transactions from the attached statement.",
  "Do not infer missing dates, merchants, descriptions, or amounts.",
  "Return uncertain rows with lower confidence and warnings.",
  "Treat debits and card purchases as spending.",
  "Treat refunds, credits, transfers, and deposits as non-spending unless the statement clearly marks them as fees or purchases.",
  "Use the exact schema.",
].join("\n");

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function createInputContent(intake: IntakeResult) {
  const base64 = intake.bytes.toString("base64");

  if (intake.fileKind === "pdf") {
    return [
      { type: "input_text" as const, text: STATEMENT_READER_PROMPT },
      {
        type: "input_file" as const,
        filename: intake.originalFileName,
        file_data: base64,
      },
    ];
  }

  return [
    { type: "input_text" as const, text: STATEMENT_READER_PROMPT },
    {
      type: "input_image" as const,
      detail: "high" as const,
      image_url: `data:${intake.mimeType};base64,${base64}`,
    },
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

  const response = await getOpenAIClient().responses.parse({
    model: process.env.OPENAI_MONEY_IMPORT_MODEL ?? "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: createInputContent(intake),
      },
    ],
    text: {
      format: zodTextFormat(statementExtractionSchema, "statement_extraction"),
    },
  });

  const parsed = statementExtractionSchema.safeParse(response.output_parsed);
  if (!parsed.success) {
    throw new Error("Statement extraction returned invalid data");
  }

  return parsed.data;
}
