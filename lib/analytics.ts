import { getMacroTotals } from "@/lib/nutrition";
import type { Entry } from "@/types/entry";

export type ValueBreakdownItem = {
  category: string;
  total: number;
  count: number;
};

export type MacroEnergyBreakdownItem = ValueBreakdownItem & {
  grams: number;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdaySortOrder = [1, 2, 3, 4, 5, 6, 0];

export function getCategoryValueBreakdown(entries: Entry[]): ValueBreakdownItem[] {
  const totals: Record<string, ValueBreakdownItem> = {};

  for (const entry of entries) {
    totals[entry.category] = {
      category: entry.category,
      total: (totals[entry.category]?.total ?? 0) + entry.value,
      count: (totals[entry.category]?.count ?? 0) + 1,
    };
  }

  return Object.values(totals);
}

export function getWeekdayValueBreakdown(entries: Entry[]): ValueBreakdownItem[] {
  const totals = weekdayLabels.map((label) => ({
    category: label,
    total: 0,
    count: 0,
  }));

  for (const entry of entries) {
    const weekday = entry.date.getDay();
    totals[weekday].total += entry.value;
    totals[weekday].count += 1;
  }

  return weekdaySortOrder
    .map((weekday) => totals[weekday])
    .filter((item) => item.count > 0);
}

export function getMacroEnergyBreakdown(entries: Entry[]): MacroEnergyBreakdownItem[] {
  const macroTotals = getMacroTotals(entries);

  return [
    {
      category: "Protein",
      grams: macroTotals.proteinGrams,
      total: macroTotals.proteinGrams * 4,
      count: entries.filter((entry) => (entry.proteinGrams ?? 0) > 0).length,
    },
    {
      category: "Carbs",
      grams: macroTotals.carbsGrams,
      total: macroTotals.carbsGrams * 4,
      count: entries.filter((entry) => (entry.carbsGrams ?? 0) > 0).length,
    },
    {
      category: "Fat",
      grams: macroTotals.fatGrams,
      total: macroTotals.fatGrams * 9,
      count: entries.filter((entry) => (entry.fatGrams ?? 0) > 0).length,
    },
  ].filter((item) => item.total > 0);
}
