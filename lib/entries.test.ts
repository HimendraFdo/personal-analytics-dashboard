import { describe, expect, it } from "vitest";
import { EntryCategory } from "@prisma/client";
import { serializeEntryJson } from "./entries";

describe("serializeEntryJson", () => {
  it("serializes Prisma entries for API responses", () => {
    const entry = {
      id: "entry-1",
      title: "Morning run",
      userId: "user_123",
      value: 5,
      category: EntryCategory.Health,
      date: new Date("2026-05-16T00:00:00.000Z"),
      note: "Felt good",
      createdAt: new Date("2026-05-16T00:00:00.000Z"),
      updatedAt: new Date("2026-05-16T00:00:00.000Z"),
    };

    expect(serializeEntryJson(entry)).toEqual({
      id: "entry-1",
      title: "Morning run",
      value: 5,
      category: "Health",
      date: "2026-05-16T00:00:00.000Z",
      note: "Felt good",
    });
  });
});
