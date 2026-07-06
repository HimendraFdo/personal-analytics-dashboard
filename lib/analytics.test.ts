import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { filterEntriesByTimeRange, TIME_RANGE_OPTIONS } from "./analytics";
import type { Entry } from "@/types/entry";

function makeEntry(id: string, date: Date): Entry {
  return {
    id,
    title: `Entry ${id}`,
    value: 10,
    metricType: "time",
    category: "Study",
    date,
    note: "",
    foodName: null,
    portionGrams: null,
    proteinGrams: null,
    carbsGrams: null,
    fatGrams: null,
    foodSource: null,
  };
}

const NOW = new Date("2026-07-06T12:00:00.000Z");

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000);
}

describe("filterEntriesByTimeRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const entries = [
    makeEntry("recent", hoursAgo(2)),
    makeEntry("yesterday", hoursAgo(30)),
    makeEntry("last-week", hoursAgo(6 * 24)),
    makeEntry("two-weeks", hoursAgo(14 * 24)),
    makeEntry("last-month", hoursAgo(29 * 24)),
    makeEntry("old", hoursAgo(90 * 24)),
  ];

  it("returns all entries unchanged for the all range", () => {
    expect(filterEntriesByTimeRange(entries, "all")).toBe(entries);
  });

  it("keeps only the last 24 hours for the day range", () => {
    const result = filterEntriesByTimeRange(entries, "day");
    expect(result.map((entry) => entry.id)).toEqual(["recent"]);
  });

  it("keeps only the last 7 days for the week range", () => {
    const result = filterEntriesByTimeRange(entries, "week");
    expect(result.map((entry) => entry.id)).toEqual([
      "recent",
      "yesterday",
      "last-week",
    ]);
  });

  it("keeps only the last 30 days for the month range", () => {
    const result = filterEntriesByTimeRange(entries, "month");
    expect(result.map((entry) => entry.id)).toEqual([
      "recent",
      "yesterday",
      "last-week",
      "two-weeks",
      "last-month",
    ]);
  });

  it("includes an entry exactly on the cutoff boundary", () => {
    const boundary = [makeEntry("boundary", hoursAgo(24))];
    expect(filterEntriesByTimeRange(boundary, "day")).toHaveLength(1);
  });

  it("returns an empty array when nothing falls in range", () => {
    const onlyOld = [makeEntry("old", hoursAgo(90 * 24))];
    expect(filterEntriesByTimeRange(onlyOld, "week")).toEqual([]);
  });
});

describe("TIME_RANGE_OPTIONS", () => {
  it("covers day, week, month, and all in order", () => {
    expect(TIME_RANGE_OPTIONS.map((option) => option.value)).toEqual([
      "day",
      "week",
      "month",
      "all",
    ]);
  });
});
