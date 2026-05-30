import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  resetMemoryRateLimitStoreForTests,
  type RateLimitStore,
} from "@/lib/rate-limit";

const policy = {
  route: "test-route",
  limit: 2,
  windowSeconds: 60,
};

describe("rateLimit", () => {
  afterEach(() => {
    resetMemoryRateLimitStoreForTests();
  });

  it("allows requests under the limit", async () => {
    const result = await rateLimit({ ...policy, userId: "user_1" });

    expect(result).toMatchObject({
      success: true,
      limit: 2,
      remaining: 1,
    });
  });

  it("blocks requests over the limit", async () => {
    await rateLimit({ ...policy, userId: "user_1" });
    await rateLimit({ ...policy, userId: "user_1" });

    const result = await rateLimit({ ...policy, userId: "user_1" });

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("isolates limits per user", async () => {
    await rateLimit({ ...policy, userId: "user_1" });
    await rateLimit({ ...policy, userId: "user_1" });

    const result = await rateLimit({ ...policy, userId: "user_2" });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("isolates limits per route", async () => {
    await rateLimit({ ...policy, userId: "user_1" });
    await rateLimit({ ...policy, userId: "user_1" });

    const result = await rateLimit({
      ...policy,
      route: "another-route",
      userId: "user_1",
    });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("uses IP fallback when no userId is available", async () => {
    await rateLimit({ ...policy, ip: "203.0.113.10" });
    await rateLimit({ ...policy, ip: "203.0.113.10" });

    const sameIp = await rateLimit({ ...policy, ip: "203.0.113.10" });
    const otherIp = await rateLimit({ ...policy, ip: "203.0.113.11" });

    expect(sameIp.success).toBe(false);
    expect(otherIp.success).toBe(true);
  });

  it("returns the 429 response shape and retry header", async () => {
    const store: RateLimitStore = {
      increment: async () => ({ count: 3, ttl: 42 }),
    };

    const response = await rateLimitResponse(
      { ...policy, userId: "user_1" },
      store
    );

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("42");
    expect(response?.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(response?.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response?.headers.get("X-RateLimit-Reset")).toBeTruthy();
    expect(await response?.json()).toEqual({
      error: {
        message: "Too many requests",
        code: "RATE_LIMITED",
      },
    });
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for IP", () => {
    const request = new NextRequest("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 198.51.100.4",
        "x-real-ip": "198.51.100.5",
      },
    });

    expect(getClientIp(request)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip", () => {
    const request = new NextRequest("http://localhost", {
      headers: {
        "x-real-ip": "198.51.100.5",
      },
    });

    expect(getClientIp(request)).toBe("198.51.100.5");
  });

  it("normalizes malformed IP values to unknown", () => {
    const request = new NextRequest("http://localhost", {
      headers: {
        "x-forwarded-for": "bad value, 203.0.113.10",
      },
    });

    expect(getClientIp(request)).toBe("unknown");
  });
});
