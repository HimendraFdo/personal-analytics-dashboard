import { afterEach, describe, expect, it, vi } from "vitest";
import { deflateSync } from "node:zlib";

const mocks = vi.hoisted(() => ({
  responsesParse: vi.fn(),
  filesCreate: vi.fn(),
  filesDelete: vi.fn(),
  toFile: vi.fn(),
}));

vi.mock("openai", () => ({
  toFile: mocks.toFile,
  default: vi.fn(function OpenAI() {
    return {
      files: {
        create: mocks.filesCreate,
        delete: mocks.filesDelete,
      },
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

  it("uploads PDFs and sends the file ID to the Responses API", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mocks.toFile.mockResolvedValue(new File(["%PDF-1.7"], "statement.pdf"));
    mocks.filesCreate.mockResolvedValue({ id: "file_pdf_123" });
    mocks.filesDelete.mockResolvedValue({ id: "file_pdf_123", deleted: true });
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

    expect(mocks.toFile).toHaveBeenCalledWith(
      Buffer.from("%PDF-1.7"),
      "statement.pdf",
      { type: "application/pdf" }
    );
    expect(mocks.filesCreate).toHaveBeenCalledWith({
      file: expect.any(File),
      purpose: "user_data",
      expires_after: {
        anchor: "created_at",
        seconds: 3600,
      },
    });
    expect(mocks.responsesParse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        input: [
          expect.objectContaining({
            content: [
              expect.objectContaining({
                type: "input_text",
                text: expect.stringContaining(
                  "Use 2026 as the year for bank-app screenshots"
                ),
              }),
              expect.objectContaining({
                type: "input_file",
                file_id: "file_pdf_123",
              }),
            ],
          }),
        ],
      })
    );
    expect(mocks.responsesParse.mock.calls[0][0].input[0].content[1]).not.toHaveProperty(
      "file_data"
    );
    expect(mocks.filesDelete).toHaveBeenCalledWith("file_pdf_123");
  });

  it("wraps provider errors with an extraction-specific message", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mocks.responsesParse.mockRejectedValue(new Error("unsupported model"));

    await expect(readStatement(intake())).rejects.toThrow(
      "Statement extraction provider request failed: unsupported model"
    );
  });

  it("deletes uploaded PDFs even when extraction fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mocks.toFile.mockResolvedValue(new File(["%PDF-1.7"], "statement.pdf"));
    mocks.filesCreate.mockResolvedValue({ id: "file_pdf_123" });
    mocks.filesDelete.mockResolvedValue({ id: "file_pdf_123", deleted: true });
    mocks.responsesParse.mockRejectedValue(new Error("invalid request"));

    await expect(readStatement(pdfIntake())).rejects.toThrow(
      "Statement extraction provider request failed: invalid request"
    );

    expect(mocks.filesDelete).toHaveBeenCalledWith("file_pdf_123");
  });

  it("falls back to inline PDF data when file upload scope is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mocks.toFile.mockResolvedValue(new File(["%PDF-1.7"], "statement.pdf"));
    mocks.filesCreate.mockRejectedValue(
      new Error(
        "401 You have insufficient permissions for this operation. Missing scopes: api.files.write"
      )
    );
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

    const fileInput = mocks.responsesParse.mock.calls[0][0].input[0].content[1];
    expect(fileInput).toEqual({
      type: "input_file",
      filename: "statement.pdf",
      file_data: `data:application/pdf;base64,${Buffer.from("%PDF-1.7").toString(
        "base64"
      )}`,
    });
    expect(mocks.filesDelete).not.toHaveBeenCalled();
  });

  it("uses extracted PDF text before OpenAI file handling when text is available", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mocks.responsesParse.mockResolvedValue({
      output_parsed: {
        accountName: null,
        statementPeriodStart: null,
        statementPeriodEnd: null,
        currency: "NZD",
        transactions: [],
        warnings: [],
      },
    });

    await readStatement(textPdfIntake());

    const content = mocks.responsesParse.mock.calls[0][0].input[0].content;
    expect(mocks.toFile).not.toHaveBeenCalled();
    expect(mocks.filesCreate).not.toHaveBeenCalled();
    expect(content[1]).toEqual(
      expect.objectContaining({
        type: "input_text",
        text: expect.stringContaining("NEW WORLD TE RAPA 4230"),
      })
    );
    expect(content[1].text).not.toContain("data:application/pdf;base64,");
  });
});
