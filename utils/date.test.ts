import { describe, expect, it } from "vitest";
import {
  formatDateForInput,
  formatDisplayDate,
  parseStoredDate,
} from "./date";

describe("parseStoredDate", () => {
  it("returns a valid Date for ISO strings", () => {
    const result = parseStoredDate("2026-05-01T00:00:00.000Z");
    expect(result.toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("falls back to today for invalid strings", () => {
    const result = parseStoredDate("not-a-date");
    expect(Number.isNaN(result.getTime())).toBe(false);
  });
});

describe("formatDateForInput", () => {
  it("formats dates as YYYY-MM-DD", () => {
    expect(formatDateForInput(new Date("2026-05-16T12:00:00.000Z"))).toBe(
      "2026-05-16"
    );
  });

  it("falls back to today for invalid input", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(formatDateForInput("invalid")).toBe(today);
  });
});

describe("formatDisplayDate", () => {
  it("returns Unknown date for invalid dates", () => {
    expect(formatDisplayDate(new Date("invalid"))).toBe("Unknown date");
  });
});
