import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { jsonError } from "@/lib/api-response";
import { validateFoodSearchQuery } from "@/lib/food-search";
import {
  getUsdaApiKey,
  searchOpenFoodFacts,
  searchUsdaFoodData,
} from "@/lib/food-search-providers";
import type { FoodSearchResult } from "@/lib/nutrition";
import {
  getClientIp,
  RATE_LIMITS,
  rateLimitResponse,
} from "@/lib/rate-limit";

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

    const query = validateFoodSearchQuery(request.nextUrl.searchParams.get("q"));
    if (!query.success) {
      return jsonError(query.message, "VALIDATION_ERROR", 400);
    }

    // USDA first: its generic whole-food entries are usually what users mean
    // when they type "banana", ahead of branded supermarket products.
    const usdaApiKey = getUsdaApiKey();
    const providers: Promise<FoodSearchResult[]>[] = [];
    if (usdaApiKey) {
      providers.push(searchUsdaFoodData(query.query, usdaApiKey));
    }
    providers.push(searchOpenFoodFacts(query.query));

    const settled = await Promise.allSettled(providers);
    const fulfilled = settled.filter(
      (result): result is PromiseFulfilledResult<FoodSearchResult[]> =>
        result.status === "fulfilled"
    );

    if (fulfilled.length === 0) {
      return jsonError("Food lookup failed", "INTERNAL_ERROR", 502);
    }

    const foods = fulfilled.flatMap((result) => result.value);

    return Response.json({ foods });
  } catch {
    return jsonError("Food lookup failed", "INTERNAL_ERROR", 500);
  }
}
