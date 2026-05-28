import { describe, expect, it } from "vitest";
import { calculatePortionNutrition, getMacroTotals } from "./nutrition";
import type { Entry } from "@/types/entry";

describe("calculatePortionNutrition", () => {
  it("scales nutrients from 100g values to the requested portion", () => {
    expect(
      calculatePortionNutrition(
        { calories: 100, protein: 10, carbs: 20, fat: 3 },
        150
      )
    ).toEqual({
      calories: 150,
      proteinGrams: 15,
      carbsGrams: 30,
      fatGrams: 4.5,
    });
  });
});

describe("getMacroTotals", () => {
  it("sums available macro fields", () => {
    const entries = [
      { proteinGrams: 10, carbsGrams: 20, fatGrams: 5 },
      { proteinGrams: null, carbsGrams: 3, fatGrams: null },
    ] as Entry[];

    expect(getMacroTotals(entries)).toEqual({
      proteinGrams: 10,
      carbsGrams: 23,
      fatGrams: 5,
    });
  });
});
