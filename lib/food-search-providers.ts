import type { FoodSearchResult } from "@/lib/nutrition";

const FOOD_SEARCH_TIMEOUT_MS = 5_000;
const RESULTS_PER_PROVIDER = 8;
const FOOD_SEARCH_USER_AGENT =
  "PersonalAnalyticsDashboard/1.0 (food lookup for user-entered nutrition)";
const FOOD_SEARCH_REVALIDATE_SECONDS = 60 * 60 * 24;

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
};

type OpenFoodFactsSearchResponse = {
  products?: OpenFoodFactsProduct[];
};

type UsdaFoodNutrient = {
  nutrientId?: number;
  unitName?: string;
  value?: number;
};

type UsdaFood = {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: UsdaFoodNutrient[];
};

type UsdaSearchResponse = {
  foods?: UsdaFood[];
};

// FoodData Central nutrient ids. Energy is reported under one of three ids
// depending on the dataset; all fallbacks are kcal-denominated.
const USDA_ENERGY_KCAL_IDS = [1008, 2047, 2048];
const USDA_PROTEIN_ID = 1003;
const USDA_FAT_ID = 1004;
const USDA_CARBS_ID = 1005;

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FOOD_SEARCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: { "User-Agent": FOOD_SEARCH_USER_AGENT },
      next: { revalidate: FOOD_SEARCH_REVALIDATE_SECONDS },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function getOpenFoodFactsBaseUrl(): string {
  const country = process.env.OPENFOODFACTS_COUNTRY?.trim().toLowerCase();

  if (country && /^[a-z]{2}$/.test(country)) {
    return `https://${country}.openfoodfacts.org`;
  }

  return "https://world.openfoodfacts.org";
}

function mapOpenFoodFactsProduct(
  product: OpenFoodFactsProduct
): FoodSearchResult | null {
  const name = product.product_name || product.generic_name;
  const nutrients = product.nutriments;
  const calories = toNumber(nutrients?.["energy-kcal_100g"]);

  if (!name || calories <= 0) {
    return null;
  }

  return {
    id: product.code || name,
    name,
    brand: product.brands || "Open Food Facts",
    servingSize: product.serving_size || null,
    nutrientsPer100g: {
      calories,
      protein: toNumber(nutrients?.proteins_100g),
      carbs: toNumber(nutrients?.carbohydrates_100g),
      fat: toNumber(nutrients?.fat_100g),
    },
    source: "Open Food Facts",
  };
}

export async function searchOpenFoodFacts(
  query: string
): Promise<FoodSearchResult[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(RESULTS_PER_PROVIDER),
    sort_by: "unique_scans_n",
    fields: "code,product_name,generic_name,brands,serving_size,nutriments",
  });

  const response = await fetchWithTimeout(
    `${getOpenFoodFactsBaseUrl()}/cgi/search.pl?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Open Food Facts lookup failed");
  }

  const data = (await response.json()) as OpenFoodFactsSearchResponse;

  return (data.products ?? [])
    .map(mapOpenFoodFactsProduct)
    .filter((food): food is FoodSearchResult => food !== null);
}

export function getUsdaApiKey(): string | null {
  const key = process.env.USDA_FDC_API_KEY?.trim();
  return key ? key : null;
}

function usdaNutrientValue(
  nutrients: UsdaFoodNutrient[],
  nutrientIds: number[]
): number {
  for (const nutrientId of nutrientIds) {
    const match = nutrients.find(
      (nutrient) => nutrient.nutrientId === nutrientId
    );
    const value = toNumber(match?.value);

    if (value > 0) {
      return value;
    }
  }

  return 0;
}

function mapUsdaFood(food: UsdaFood): FoodSearchResult | null {
  const name = food.description?.trim();
  const nutrients = food.foodNutrients ?? [];
  const calories = usdaNutrientValue(nutrients, USDA_ENERGY_KCAL_IDS);

  if (!name || !food.fdcId || calories <= 0) {
    return null;
  }

  const servingSize =
    food.servingSize && food.servingSizeUnit
      ? `${food.servingSize} ${food.servingSizeUnit}`
      : null;

  return {
    id: `fdc-${food.fdcId}`,
    name,
    brand: food.brandName || food.brandOwner || "USDA",
    servingSize,
    nutrientsPer100g: {
      calories,
      protein: usdaNutrientValue(nutrients, [USDA_PROTEIN_ID]),
      carbs: usdaNutrientValue(nutrients, [USDA_CARBS_ID]),
      fat: usdaNutrientValue(nutrients, [USDA_FAT_ID]),
    },
    source: "USDA FoodData Central",
  };
}

export async function searchUsdaFoodData(
  query: string,
  apiKey: string
): Promise<FoodSearchResult[]> {
  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    // Generic whole/common foods only; branded US products would crowd out
    // the Open Food Facts results without helping non-US users.
    dataType: "Foundation,SR Legacy,Survey (FNDDS)",
    pageSize: String(RESULTS_PER_PROVIDER),
  });

  const response = await fetchWithTimeout(
    `https://api.nal.usda.gov/fdc/v1/foods/search?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("USDA FoodData Central lookup failed");
  }

  const data = (await response.json()) as UsdaSearchResponse;

  return (data.foods ?? [])
    .map(mapUsdaFood)
    .filter((food): food is FoodSearchResult => food !== null);
}
