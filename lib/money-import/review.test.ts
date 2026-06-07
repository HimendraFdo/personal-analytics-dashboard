import { describe, expect, it } from "vitest";
import { reviewMoneyImportDrafts } from "./review";

describe("reviewMoneyImportDrafts", () => {
  it("flags same-user same-date same-title same-value duplicate candidates", async () => {
    const tx = {
      entry: {
        findMany: async () => [
          {
            title: "Coffee Shop",
            value: 12.5,
            date: new Date("2026-05-16T10:00:00.000Z"),
          },
        ],
      },
    };

    const result = await reviewMoneyImportDrafts(tx as never, "user_123", [
      {
        id: "draft-1",
        date: "2026-05-16",
        title: " coffee   shop ",
        value: 12.5,
        category: "Finance",
        note: "",
        confidence: 0.9,
        duplicateCandidate: false,
        warnings: [],
      },
    ]);

    expect(result.drafts[0]?.duplicateCandidate).toBe(true);
    expect(result.summary.duplicateCandidateRows).toBe(1);
  });
});
