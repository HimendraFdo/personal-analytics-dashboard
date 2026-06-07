import { afterEach, describe, expect, it, vi } from "vitest";
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

afterEach(() => {
  vi.unstubAllEnvs();
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
});
