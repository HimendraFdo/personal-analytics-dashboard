import { describe, expect, it, vi } from "vitest";
import { normalizeStatementExtraction } from "./normalize";

vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "draft-id"),
});

describe("normalizeStatementExtraction", () => {
  it("normalizes debit transactions to positive Finance money drafts", () => {
    const result = normalizeStatementExtraction({
      accountName: null,
      statementPeriodStart: null,
      statementPeriodEnd: null,
      currency: "USD",
      warnings: [],
      transactions: [
        {
          sourceRowId: "1",
          date: "2026-05-16",
          description: "Coffee Shop",
          amount: -12.5,
          currency: "USD",
          direction: "debit",
          confidence: 0.95,
          warnings: [],
        },
      ],
    });

    expect(result.rejectedRows).toEqual([]);
    expect(result.drafts[0]).toEqual(
      expect.objectContaining({
        title: "Coffee Shop",
        value: 12.5,
        category: "Finance",
        date: "2026-05-16",
        duplicateCandidate: false,
      })
    );
  });

  it("warns on credits and rejects incomplete rows", () => {
    const result = normalizeStatementExtraction({
      accountName: null,
      statementPeriodStart: null,
      statementPeriodEnd: null,
      currency: "USD",
      warnings: [],
      transactions: [
        {
          sourceRowId: "credit-1",
          date: "2026-05-16",
          description: "Refund",
          amount: 5,
          currency: "USD",
          direction: "credit",
          confidence: 0.7,
          warnings: [],
        },
        {
          sourceRowId: "bad-1",
          date: null,
          description: "Missing date",
          amount: 5,
          currency: "USD",
          direction: "debit",
          confidence: 1,
          warnings: [],
        },
      ],
    });

    expect(result.drafts[0]?.warnings).toEqual([
      "Low extraction confidence",
      "Review non-debit transaction before importing",
    ]);
    expect(result.rejectedRows).toEqual([
      {
        sourceRowId: "bad-1",
        reason: "Missing or invalid date",
        rawDescription: "Missing date",
      },
    ]);
  });

  it("uses the statement period year for day-month transaction dates", () => {
    const result = normalizeStatementExtraction({
      accountName: null,
      statementPeriodStart: "2026-04-10",
      statementPeriodEnd: "2026-05-11",
      currency: "NZD",
      warnings: [],
      transactions: [
        {
          sourceRowId: "1",
          date: "11 Apr",
          description: "NEW WORLD TE RAPA 4230",
          amount: 7.99,
          currency: "NZD",
          direction: "debit",
          confidence: 1,
          warnings: [],
        },
      ],
    });

    expect(result.drafts[0]?.date).toBe("2026-04-11");
  });
});
