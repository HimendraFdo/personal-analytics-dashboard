import { describe, expect, it } from "vitest";
import {
  createEntrySchema,
  entryIdSchema,
  parseEntryDate,
  sortSchema,
  updateEntrySchema,
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
      value: 45,
      metricType: "time",
      category: "Study",
      date: "2026-05-16",
      note: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts SQL-looking text as plain title and note data", () => {
    const payload = {
      title: "' OR 1=1 --",
      value: 45,
      metricType: "time",
      category: "Study",
      date: "2026-05-16",
      note: "Robert'); DELETE FROM Entry; --",
    };

    const result = createEntrySchema.parse(payload);

    expect(result.title).toBe(payload.title);
    expect(result.note).toBe(payload.note);
  });

  it("defaults metric type to time", () => {
    const result = createEntrySchema.parse({
      title: "Study session",
      value: 45,
      category: "Study",
      date: "2026-05-16",
    });
    expect(result.metricType).toBe("time");
  });

  it("accepts decimal money values", () => {
    const result = createEntrySchema.parse({
      title: "Coffee",
      value: "12.50",
      metricType: "money",
      category: "Finance",
      date: "2026-05-16",
    });

    expect(result.value).toBe(12.5);
    expect(result.metricType).toBe("money");
  });

  it("rejects invalid metric types", () => {
    const result = createEntrySchema.safeParse({
      title: "Coffee",
      value: "12.50",
      metricType: "budget",
      category: "Finance",
      date: "2026-05-16",
    });

    expect(result.success).toBe(false);
  });

  it("accepts calories macro payloads", () => {
    const result = createEntrySchema.parse({
      title: "Greek yogurt",
      value: "125",
      metricType: "calories",
      date: "2026-05-16",
      foodName: "Greek yogurt",
      portionGrams: "150",
      proteinGrams: "15.5",
      carbsGrams: "6",
      fatGrams: "2.3",
      foodSource: "Open Food Facts",
    });

    expect(result.metricType).toBe("calories");
    expect(result.category).toBeUndefined();
    expect(result.portionGrams).toBe(150);
    expect(result.proteinGrams).toBe(15.5);
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

  it("rejects non-positive values", () => {
    const result = createEntrySchema.safeParse({
      title: "Study session",
      value: 0,
      category: "Study",
      date: "2026-05-16",
    });
    expect(result.success).toBe(false);
  });

  it("rejects ownership fields", () => {
    const result = createEntrySchema.safeParse({
      userId: "user_attacker",
      title: "Study session",
      value: 45,
      category: "Study",
      date: "2026-05-16",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateEntrySchema", () => {
  it("rejects ownership fields", () => {
    const result = updateEntrySchema.safeParse({
      userId: "user_attacker",
      title: "Updated",
    });

    expect(result.success).toBe(false);
  });
});

describe("sortSchema", () => {
  it("defaults to date_desc", () => {
    expect(sortSchema.parse(undefined)).toBe("date_desc");
  });

  it("rejects malicious sort values", () => {
    const result = sortSchema.safeParse("date_desc; DELETE FROM Entry");

    expect(result.success).toBe(false);
  });
});

describe("entryIdSchema", () => {
  it("accepts UUID entry ids", () => {
    expect(
      entryIdSchema.safeParse("123e4567-e89b-12d3-a456-426614174000").success
    ).toBe(true);
  });

  it("rejects invalid UUID entry ids", () => {
    expect(entryIdSchema.safeParse("' OR 1=1 --").success).toBe(false);
  });
});
