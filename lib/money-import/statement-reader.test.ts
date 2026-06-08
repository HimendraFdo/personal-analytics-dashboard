import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  responsesParse: vi.fn(),
}));

vi.mock("openai", () => ({
  default: vi.fn(function OpenAI() {
    return {
      responses: {
        parse: mocks.responsesParse,
      },
    };
  }),
}));

import { readStatement } from "./statement-reader";
import type { IntakeResult } from "./types";

function intake(): IntakeResult {
  return {
    runId: "123e4567-e89b-12d3-a456-426614174000",
    fileKind: "image",
    originalFileName: "statement.png",
    mimeType: "image/png",
    bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  };
}

function pdfIntake(): IntakeResult {
  return {
    runId: "123e4567-e89b-12d3-a456-426614174000",
    fileKind: "pdf",
    originalFileName: "statement.pdf",
    mimeType: "application/pdf",
    bytes: Buffer.from("%PDF-1.7"),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("readStatement", () => {
  it("can read a deterministic extraction fixture for local QA", async () => {
    vi.stubEnv(
      "MONEY_IMPORT_EXTRACT_FIXTURE_PATH",
      "lib/money-import/fixtures/synthetic-bank-statement.json"
    );
    vi.stubEnv("NODE_ENV", "test");

    const extraction = await readStatement(intake());

    expect(extraction).toEqual(
      expect.objectContaining({
        accountName: "QA Checking",
        currency: "USD",
        warnings: ["Synthetic fixture for deterministic local QA"],
      })
    );
    expect(extraction.transactions).toHaveLength(3);
  });

  it("does not allow fixture mode in production", async () => {
    vi.stubEnv(
      "MONEY_IMPORT_EXTRACT_FIXTURE_PATH",
      "lib/money-import/fixtures/synthetic-bank-statement.json"
    );
    vi.stubEnv("NODE_ENV", "production");

    await expect(readStatement(intake())).rejects.toThrow(
      "Statement extraction fixture mode is not allowed in production"
    );
  });

  it("sends PDF file_data as raw base64 for the Responses API", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mocks.responsesParse.mockResolvedValue({
      output_parsed: {
        accountName: null,
        statementPeriodStart: null,
        statementPeriodEnd: null,
        currency: "USD",
        transactions: [],
        warnings: [],
      },
    });

    await readStatement(pdfIntake());

    expect(mocks.responsesParse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: [
          expect.objectContaining({
            content: [
              expect.objectContaining({ type: "input_text" }),
              expect.objectContaining({
                type: "input_file",
                filename: "statement.pdf",
                file_data: Buffer.from("%PDF-1.7").toString("base64"),
              }),
            ],
          }),
        ],
      })
    );
    expect(
      mocks.responsesParse.mock.calls[0][0].input[0].content[1].file_data
    ).not.toContain("data:application/pdf;base64,");
  });
});
