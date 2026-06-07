import { describe, expect, it } from "vitest";
import { statementExtractionSchema } from "./extraction-schema";

describe("statementExtractionSchema", () => {
  it("accepts structured statement output", () => {
    const parsed = statementExtractionSchema.parse({
      accountName: null,
      statementPeriodStart: null,
      statementPeriodEnd: null,
      currency: "USD",
      transactions: [
        {
          sourceRowId: "row-1",
          date: "2026-05-16",
          description: "Groceries",
          amount: 42.1,
          currency: "USD",
          direction: "debit",
          confidence: 0.9,
          warnings: [],
        },
      ],
      warnings: [],
    });

    expect(parsed.transactions).toHaveLength(1);
  });

  it("rejects malformed model output", () => {
    const result = statementExtractionSchema.safeParse({
      accountName: null,
      statementPeriodStart: null,
      statementPeriodEnd: null,
      currency: "USD",
      transactions: [
        {
          sourceRowId: "row-1",
          date: "2026-05-16",
          description: "Groceries",
          amount: 42.1,
          currency: "USD",
          direction: "maybe",
          confidence: 2,
          warnings: [],
        },
      ],
      warnings: [],
    });

    expect(result.success).toBe(false);
  });
});
