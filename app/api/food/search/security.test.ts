import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { validateFoodSearchQuery } from "@/lib/food-search";
import { resetMemoryRateLimitStoreForTests } from "@/lib/rate-limit";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

import { GET } from "./route";

const userId = "user_123";

function searchRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/food/search${query}`, {
    headers: { "x-forwarded-for": "203.0.113.10" },
  });
}

async function readJson(response: Response) {
  return response.json();
}

describe("food search query validation", () => {
  it.each([null, "", "   "])("rejects missing or blank query %s", (query) => {
    expect(validateFoodSearchQuery(query)).toEqual({
      success: false,
      message: "Search query must be at least 2 characters",
    });
  });

  it("rejects one-character queries", () => {
    expect(validateFoodSearchQuery("a")).toEqual({
      success: false,
      message: "Search query must be at least 2 characters",
    });
  });

  it("rejects overlong queries", () => {
    expect(validateFoodSearchQuery("a".repeat(81))).toEqual({
      success: false,
      message: "Search query must be at most 80 characters",
    });
  });

  it("rejects control characters", () => {
    expect(validateFoodSearchQuery("oat\nmilk")).toEqual({
      success: false,
      message: "Search query contains invalid characters",
    });
  });

  it("accepts normal punctuation and accented characters", () => {
    expect(validateFoodSearchQuery("  café   latte / weet-bix 1L  ")).toEqual({
      success: true,
      query: "café latte / weet-bix 1L",
    });
  });
});

describe("food search route abuse protection", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    resetMemoryRateLimitStoreForTests();
  });

  it("returns 401 for unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    vi.stubGlobal("fetch", vi.fn());

    const response = await GET(searchRequest("?q=oat%20milk"));

    expect(response.status).toBe(401);
    expect(await readJson(response)).toEqual({
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing query", async () => {
    mocks.auth.mockResolvedValue({ userId });
    vi.stubGlobal("fetch", vi.fn());

    const response = await GET(searchRequest(""));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Search query must be at least 2 characters",
        code: "VALIDATION_ERROR",
      },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for a one-character query", async () => {
    mocks.auth.mockResolvedValue({ userId });
    vi.stubGlobal("fetch", vi.fn());

    const response = await GET(searchRequest("?q=x"));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Search query must be at least 2 characters",
        code: "VALIDATION_ERROR",
      },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for an overlong query", async () => {
    mocks.auth.mockResolvedValue({ userId });
    vi.stubGlobal("fetch", vi.fn());

    const response = await GET(searchRequest(`?q=${"a".repeat(81)}`));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Search query must be at most 80 characters",
        code: "VALIDATION_ERROR",
      },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for control characters", async () => {
    mocks.auth.mockResolvedValue({ userId });
    vi.stubGlobal("fetch", vi.fn());

    const response = await GET(searchRequest("?q=oat%0Amilk"));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        message: "Search query contains invalid characters",
        code: "VALIDATION_ERROR",
      },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses fixed upstream params plus the validated query", async () => {
    mocks.auth.mockResolvedValue({ userId });
    vi.stubEnv("USDA_FDC_API_KEY", "");
    vi.stubEnv("OPENFOODFACTS_COUNTRY", "");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          products: [
            {
              code: "123",
              product_name: "Café latte",
              brands: "Brand",
              serving_size: "250 ml",
              nutriments: {
                "energy-kcal_100g": 42,
                proteins_100g: 3,
                carbohydrates_100g: 5,
                fat_100g: 1,
              },
            },
          ],
        })
      )
    );

    const response = await GET(
      searchRequest("?q=%20caf%C3%A9%20%20latte%20&page_size=100&json=0")
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({
      foods: [
        {
          id: "123",
          name: "Café latte",
          brand: "Brand",
          servingSize: "250 ml",
          nutrientsPer100g: {
            calories: 42,
            protein: 3,
            carbs: 5,
            fat: 1,
          },
          source: "Open Food Facts",
        },
      ],
    });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    const upstreamUrl = new URL(String(url));

    expect(upstreamUrl.origin).toBe("https://world.openfoodfacts.org");
    expect(upstreamUrl.pathname).toBe("/cgi/search.pl");
    expect(Object.fromEntries(upstreamUrl.searchParams)).toEqual({
      search_terms: "café latte",
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "8",
      sort_by: "unique_scans_n",
      fields: "code,product_name,generic_name,brands,serving_size,nutriments",
    });
    expect(init).toMatchObject({
      headers: {
        "User-Agent":
          "PersonalAnalyticsDashboard/1.0 (food lookup for user-entered nutrition)",
      },
      next: { revalidate: 60 * 60 * 24 },
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns a safe 502 when the upstream fetch times out", async () => {
    mocks.auth.mockResolvedValue({ userId });
    vi.stubEnv("USDA_FDC_API_KEY", "");
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string | URL | Request, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      })
    );

    const responsePromise = GET(searchRequest("?q=oat%20milk"));
    await vi.advanceTimersByTimeAsync(5_000);
    const response = await responsePromise;

    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({
      error: { message: "Food lookup failed", code: "INTERNAL_ERROR" },
    });
  });

  it("returns a safe 502 when the upstream response fails", async () => {
    mocks.auth.mockResolvedValue({ userId });
    vi.stubEnv("USDA_FDC_API_KEY", "");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("upstream internals", {
          status: 503,
          statusText: "Service Unavailable",
        })
      )
    );

    const response = await GET(searchRequest("?q=oat%20milk"));

    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({
      error: { message: "Food lookup failed", code: "INTERNAL_ERROR" },
    });
  });

  it("uses the country-specific Open Food Facts host when configured", async () => {
    mocks.auth.mockResolvedValue({ userId });
    vi.stubEnv("USDA_FDC_API_KEY", "");
    vi.stubEnv("OPENFOODFACTS_COUNTRY", "nz");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ products: [] }))
    );

    const response = await GET(searchRequest("?q=weet-bix"));

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledOnce();
    const upstreamUrl = new URL(String(vi.mocked(fetch).mock.calls[0][0]));
    expect(upstreamUrl.origin).toBe("https://nz.openfoodfacts.org");
  });

  it("merges USDA results ahead of Open Food Facts when a key is configured", async () => {
    mocks.auth.mockResolvedValue({ userId });
    vi.stubEnv("USDA_FDC_API_KEY", "test-fdc-key");
    vi.stubEnv("OPENFOODFACTS_COUNTRY", "");
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string | URL | Request) => {
        const target = new URL(String(url));

        if (target.hostname === "api.nal.usda.gov") {
          expect(target.pathname).toBe("/fdc/v1/foods/search");
          expect(target.searchParams.get("api_key")).toBe("test-fdc-key");
          expect(target.searchParams.get("query")).toBe("banana");
          expect(target.searchParams.get("dataType")).toBe(
            "Foundation,SR Legacy,Survey (FNDDS)"
          );

          return Promise.resolve(
            Response.json({
              foods: [
                {
                  fdcId: 1105314,
                  description: "Bananas, ripe and slightly ripe, raw",
                  foodNutrients: [
                    { nutrientId: 1008, value: 98 },
                    { nutrientId: 1003, value: 0.74 },
                    { nutrientId: 1005, value: 23 },
                    { nutrientId: 1004, value: 0.29 },
                  ],
                },
                {
                  fdcId: 999,
                  description: "No energy data",
                  foodNutrients: [{ nutrientId: 1003, value: 1 }],
                },
              ],
            })
          );
        }

        return Promise.resolve(
          Response.json({
            products: [
              {
                code: "9300652016758",
                product_name: "Banana bread",
                brands: "Bakery",
                nutriments: {
                  "energy-kcal_100g": 320,
                  proteins_100g: 5,
                  carbohydrates_100g: 50,
                  fat_100g: 10,
                },
              },
            ],
          })
        );
      })
    );

    const response = await GET(searchRequest("?q=banana"));

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(await readJson(response)).toEqual({
      foods: [
        {
          id: "fdc-1105314",
          name: "Bananas, ripe and slightly ripe, raw",
          brand: "USDA",
          servingSize: null,
          nutrientsPer100g: {
            calories: 98,
            protein: 0.74,
            carbs: 23,
            fat: 0.29,
          },
          source: "USDA FoodData Central",
        },
        {
          id: "9300652016758",
          name: "Banana bread",
          brand: "Bakery",
          servingSize: null,
          nutrientsPer100g: {
            calories: 320,
            protein: 5,
            carbs: 50,
            fat: 10,
          },
          source: "Open Food Facts",
        },
      ],
    });
  });

  it("still returns results when one provider fails", async () => {
    mocks.auth.mockResolvedValue({ userId });
    vi.stubEnv("USDA_FDC_API_KEY", "test-fdc-key");
    vi.stubEnv("OPENFOODFACTS_COUNTRY", "");
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string | URL | Request) => {
        const target = new URL(String(url));

        if (target.hostname === "api.nal.usda.gov") {
          return Promise.resolve(
            new Response("upstream internals", { status: 503 })
          );
        }

        return Promise.resolve(
          Response.json({
            products: [
              {
                code: "123",
                product_name: "Oat milk",
                brands: "Brand",
                nutriments: { "energy-kcal_100g": 46 },
              },
            ],
          })
        );
      })
    );

    const response = await GET(searchRequest("?q=oat%20milk"));

    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.foods).toHaveLength(1);
    expect(body.foods[0]).toMatchObject({
      name: "Oat milk",
      source: "Open Food Facts",
    });
  });
});
