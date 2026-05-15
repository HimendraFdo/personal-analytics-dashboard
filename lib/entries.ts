import type { Entry as PrismaEntry } from "@prisma/client";
import type { Entry, EntryCategory } from "@/types/entry";

export function serializeEntry(entry: PrismaEntry): Entry {
  return {
    id: entry.id,
    title: entry.title,
    value: entry.value,
    category: entry.category as EntryCategory,
    date: entry.date,
    note: entry.note,
  };
}

export function serializeEntryJson(entry: PrismaEntry) {
  return {
    id: entry.id,
    title: entry.title,
    value: entry.value,
    category: entry.category,
    date: entry.date.toISOString(),
    note: entry.note,
  };
}
