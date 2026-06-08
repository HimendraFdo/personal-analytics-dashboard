import { describe, expect, it } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import {
  statementExtractionProviderSchema,
  statementExtractionSchema,
} from "./extraction-schema";

function collectUnsupportedSchemaKeywords(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const unsupported = new Set([
    "default",
    "format",
    "maxLength",
    "minLength",
    "maximum",
    "minimum",
    "pattern",
  ]);
  const entries = Object.entries(value);

  return [
    ...entries
      .filter(([key]) => unsupported.has(key))
      .map(([key]) => key),
    ...entries.flatMap(([, child]) => {
      if (Array.isArray(child)) {
        return child.flatMap(collectUnsupportedSchemaKeywords);
      }

      return collectUnsupportedSchemaKeywords(child);
    }),
  ];
}

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

  it("normalizes harmless blank model fields instead of failing extraction", () => {
    const parsed = statementExtractionSchema.parse({
      accountName: "",
      statementPeriodStart: "",
      statementPeriodEnd: null,
      currency: "",
      transactions: [
        {
          sourceRowId: "row-1",
          date: "",
          description: "Groceries",
          amount: "",
          currency: "",
          direction: "debit",
          confidence: "0.9",
          warnings: ["", "  Needs review  "],
        },
      ],
      warnings: ["", "  Some rows were unclear  "],
    });

    expect(parsed).toEqual(
      expect.objectContaining({
        accountName: null,
        statementPeriodStart: null,
        statementPeriodEnd: null,
        currency: "USD",
        warnings: ["Some rows were unclear"],
      })
    );
    expect(parsed.transactions[0]).toEqual(
      expect.objectContaining({
        date: null,
        amount: null,
        currency: null,
        warnings: ["Needs review"],
      })
    );
  });

  it("keeps the OpenAI provider schema within the supported strict JSON schema subset", () => {
    const format = zodTextFormat(
      statementExtractionProviderSchema,
      "statement_extraction"
    );

    expect(collectUnsupportedSchemaKeywords(format.schema)).toEqual([]);
  });
});
