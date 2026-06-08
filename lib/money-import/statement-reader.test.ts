import { afterEach, describe, expect, it, vi } from "vitest";
import { deflateSync } from "node:zlib";

const mocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(function GoogleGenerativeAI() {
    return {
      getGenerativeModel: vi.fn(() => ({
        generateContent: mocks.generateContent,
      })),
    };
  }),
}));

import { readStatement } from "./statement-reader";
import type { IntakeResult } from "./types";

const validOutput = {
  accountName: null,
  statementPeriodStart: null,
  statementPeriodEnd: null,
  currency: "USD",
  transactions: [],
  warnings: [],
};

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

function textPdfIntake(): IntakeResult {
  const stream = deflateSync(
    [
      "BT",
      "(11 Apr)Tj",
      "(NEW WORLD TE RAPA 4230)Tj",
      "(PS)Tj",
      "(7.99)Tj",
      "ET",
    ].join("\n")
  );
  const bytes = Buffer.concat([
    Buffer.from("%PDF-1.7\n1 0 obj\n<< /Filter /FlateDecode >>\nstream\n"),
    stream,
    Buffer.from("\nendstream\nendobj\n%%EOF"),
  ]);

  return {
    runId: "123e4567-e89b-12d3-a456-426614174000",
    fileKind: "pdf",
    originalFileName: "statement.pdf",
    mimeType: "application/pdf",
    bytes,
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

  it("sends image inline to Gemini for image files", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mocks.generateContent.mockResolvedValue({ response: { text: () => JSON.stringify(validOutput) } });

    await readStatement(intake());

    const parts = mocks.generateContent.mock.calls[0][0];
    expect(parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: expect.stringContaining("Use 2026 as the year") }),
        expect.objectContaining({ inlineData: expect.objectContaining({ mimeType: expect.any(String) }) }),
      ])
    );
  });

  it("sends extracted PDF text to Gemini when text is available", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mocks.generateContent.mockResolvedValue({ response: { text: () => JSON.stringify(validOutput) } });

    await readStatement(textPdfIntake());

    const arg = mocks.generateContent.mock.calls[0][0];
    expect(typeof arg).toBe("string");
    expect(arg).toContain("NEW WORLD TE RAPA 4230");
  });

  it("sends PDF inline to Gemini when text extraction is not available", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mocks.generateContent.mockResolvedValue({ response: { text: () => JSON.stringify(validOutput) } });

    await readStatement(pdfIntake());

    const parts = mocks.generateContent.mock.calls[0][0];
    expect(Array.isArray(parts)).toBe(true);
    expect(parts[1]).toEqual(
      expect.objectContaining({
        inlineData: expect.objectContaining({ mimeType: "application/pdf" }),
      })
    );
  });

  it("wraps provider errors with an extraction-specific message", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mocks.generateContent.mockRejectedValue(new Error("unsupported model"));

    await expect(readStatement(intake())).rejects.toThrow(
      "Statement extraction provider request failed: unsupported model"
    );
  });

  it("throws when Gemini returns invalid JSON", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mocks.generateContent.mockResolvedValue({ response: { text: () => "not json" } });

    await expect(readStatement(intake())).rejects.toThrow(
      "Statement extraction returned invalid data"
    );
  });

  it("throws when Gemini returns JSON that fails schema validation", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mocks.generateContent.mockResolvedValue({ response: { text: () => JSON.stringify({ unexpected: true }) } });

    await expect(readStatement(intake())).rejects.toThrow(
      "Statement extraction returned invalid data"
    );
  });
});
