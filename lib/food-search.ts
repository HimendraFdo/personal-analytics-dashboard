const FOOD_SEARCH_MAX_QUERY_LENGTH = 80;

export type FoodSearchQueryValidationResult =
  | { success: true; query: string }
  | { success: false; message: string };

export function validateFoodSearchQuery(
  value: string | null
): FoodSearchQueryValidationResult {
  const trimmed = value?.trim() ?? "";

  if (/[\u0000-\u001f\u007f]/.test(trimmed)) {
    return {
      success: false,
      message: "Search query contains invalid characters",
    };
  }

  const normalized = trimmed.replace(/\s+/g, " ");

  if (!normalized || normalized.length < 2) {
    return {
      success: false,
      message: "Search query must be at least 2 characters",
    };
  }

  if (normalized.length > FOOD_SEARCH_MAX_QUERY_LENGTH) {
    return {
      success: false,
      message: "Search query must be at most 80 characters",
    };
  }

  return { success: true, query: normalized };
}
