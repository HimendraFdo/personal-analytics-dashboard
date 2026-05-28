import type { Entry } from "@/types/entry";

export type FoodSearchResult = {
  id: string;
  name: string;
  brand: string;
  servingSize: string | null;
  nutrientsPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  source: string;
};

export type MacroTotals = {
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

export function formatMacroValue(value: number): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value)} g`;
}

export function calculatePortionNutrition(
  nutrientsPer100g: FoodSearchResult["nutrientsPer100g"],
  portionGrams: number
) {
  const factor = portionGrams / 100;
  return {
    calories: Math.round(nutrientsPer100g.calories * factor),
    proteinGrams: roundMacro(nutrientsPer100g.protein * factor),
    carbsGrams: roundMacro(nutrientsPer100g.carbs * factor),
    fatGrams: roundMacro(nutrientsPer100g.fat * factor),
  };
}

export function getMacroTotals(entries: Entry[]): MacroTotals {
  return entries.reduce(
    (totals, entry) => ({
      proteinGrams: totals.proteinGrams + (entry.proteinGrams ?? 0),
      carbsGrams: totals.carbsGrams + (entry.carbsGrams ?? 0),
      fatGrams: totals.fatGrams + (entry.fatGrams ?? 0),
    }),
    { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 }
  );
}

export function hasMacroData(entry: Entry): boolean {
  return (
    entry.proteinGrams !== null ||
    entry.carbsGrams !== null ||
    entry.fatGrams !== null
  );
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}
