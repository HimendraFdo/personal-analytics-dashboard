import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { jsonError } from "@/lib/api-response";
import type { FoodSearchResult } from "@/lib/nutrition";
import {
  getClientIp,
  RATE_LIMITS,
  rateLimitResponse,
} from "@/lib/rate-limit";

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

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapProduct(product: OpenFoodFactsProduct): FoodSearchResult | null {
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

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const ipLimited = await rateLimitResponse({
      ...RATE_LIMITS.foodSearchIp,
      ip: getClientIp(request),
    });
    if (ipLimited) {
      return ipLimited;
    }

    const userLimited = await rateLimitResponse({
      ...RATE_LIMITS.foodSearchUser,
      userId,
    });
    if (userLimited) {
      return userLimited;
    }

    const query = request.nextUrl.searchParams.get("q")?.trim();
    if (!query || query.length < 2) {
      return jsonError("Search query must be at least 2 characters", "VALIDATION_ERROR", 400);
    }

    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "8",
      fields:
        "code,product_name,generic_name,brands,serving_size,nutriments",
    });

    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`,
      {
        headers: {
          "User-Agent":
            "PersonalAnalyticsDashboard/1.0 (food lookup for user-entered nutrition)",
        },
        next: { revalidate: 60 * 60 * 24 },
      }
    );

    if (!response.ok) {
      return jsonError("Food lookup failed", "INTERNAL_ERROR", 502);
    }

    const data = (await response.json()) as OpenFoodFactsSearchResponse;
    const foods = (data.products ?? [])
      .map(mapProduct)
      .filter((food): food is FoodSearchResult => food !== null);

    return Response.json({ foods });
  } catch {
    return jsonError("Food lookup failed", "INTERNAL_ERROR", 500);
  }
}
