import type { Entry as PrismaEntry } from "@prisma/client";
import { parseMetricType } from "@/lib/metrics";
import type { Entry } from "@/types/entry";

export function serializeEntry(entry: PrismaEntry): Entry {
  return {
    id: entry.id,
    title: entry.title,
    value: entry.value,
    metricType: parseMetricType(entry.metricType),
    category: entry.category,
    date: entry.date,
    note: entry.note,
    foodName: entry.foodName,
    portionGrams: entry.portionGrams,
    proteinGrams: entry.proteinGrams,
    carbsGrams: entry.carbsGrams,
    fatGrams: entry.fatGrams,
    foodSource: entry.foodSource,
  };
}

export function serializeEntryJson(entry: PrismaEntry) {
  return {
    id: entry.id,
    title: entry.title,
    value: entry.value,
    metricType: parseMetricType(entry.metricType),
    category: entry.category,
    date: entry.date.toISOString(),
    note: entry.note,
    foodName: entry.foodName,
    portionGrams: entry.portionGrams,
    proteinGrams: entry.proteinGrams,
    carbsGrams: entry.carbsGrams,
    fatGrams: entry.fatGrams,
    foodSource: entry.foodSource,
  };
}
