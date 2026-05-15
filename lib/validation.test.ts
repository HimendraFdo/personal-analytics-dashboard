import { describe, expect, it } from "vitest";
import {
  createEntrySchema,
  parseEntryDate,
  sortSchema,
} from "./validation";

describe("parseEntryDate", () => {
  it("parses date-only strings as UTC midnight", () => {
    const result = parseEntryDate("2026-05-16");
    expect(result.toISOString()).toBe("2026-05-16T00:00:00.000Z");
  });

  it("throws for invalid date strings", () => {
    expect(() => parseEntryDate("not-a-date")).toThrow("Invalid date");
  });
});

describe("createEntrySchema", () => {
  it("accepts valid entry payloads", () => {
    const result = createEntrySchema.safeParse({
      title: "Study session",
      value: 2.5,
      category: "Study",
      date: "2026-05-16",
      note: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty titles", () => {
    const result = createEntrySchema.safeParse({
      title: "   ",
      value: 1,
      category: "Health",
      date: "2026-05-16",
    });
    expect(result.success).toBe(false);
  });
});

describe("sortSchema", () => {
  it("defaults to date_desc", () => {
    expect(sortSchema.parse(undefined)).toBe("date_desc");
  });
});
