import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api-response";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter?: number;
  reset?: number;
};

export type RateLimitPolicy = {
  route: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitInput = RateLimitPolicy & {
  userId?: string | null;
  ip?: string | null;
};

export type RateLimitStore = {
  increment(key: string, windowSeconds: number): Promise<{
    count: number;
    ttl?: number;
  }>;
};

export const RATE_LIMITS = {
  entriesRead: {
    route: "entries:get",
    limit: 60,
    windowSeconds: 60,
  },
  entriesCreate: {
    route: "entries:post",
    limit: 20,
    windowSeconds: 60,
  },
  entriesUpdate: {
    route: "entries:patch",
    limit: 30,
    windowSeconds: 60,
  },
  entriesDelete: {
    route: "entries:delete",
    limit: 20,
    windowSeconds: 60,
  },
  foodSearchUser: {
    route: "food-search:get:user",
    limit: 20,
    windowSeconds: 60,
  },
  foodSearchIp: {
    route: "food-search:get:ip",
    limit: 60,
    windowSeconds: 60,
  },
  moneyImportExtract: {
    route: "money-import:post",
    limit: 5,
    windowSeconds: 60,
  },
  moneyImportCommit: {
    route: "money-import-commit:post",
    limit: 10,
    windowSeconds: 60,
  },
} satisfies Record<string, RateLimitPolicy>;

const memoryCounters = new Map<string, { count: number; resetAt: number }>();

class MemoryRateLimitStore implements RateLimitStore {
  async increment(key: string, windowSeconds: number) {
    const now = Date.now();
    const existing = memoryCounters.get(key);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowSeconds * 1000;
      memoryCounters.set(key, { count: 1, resetAt });
      return { count: 1, ttl: windowSeconds };
    }

    existing.count += 1;
    return {
      count: existing.count,
      ttl: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
}

class UpstashRateLimitStore implements RateLimitStore {
  constructor(private url: string, private token: string) {}

  async increment(key: string, windowSeconds: number) {
    const count = await this.command<number>(["INCR", key]);
    let ttl = await this.command<number>(["TTL", key]);

    if (count === 1 || ttl < 0) {
      await this.command<number>(["EXPIRE", key, windowSeconds]);
      ttl = windowSeconds;
    }

    return { count, ttl };
  }

  private async command<T>(command: (string | number)[]): Promise<T> {
    const response = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([command]),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Rate limit store request failed");
    }

    const data = (await response.json()) as Array<{
      result?: T;
      error?: string;
    }>;
    const result = data[0];

    if (!result || result.error || result.result === undefined) {
      throw new Error("Rate limit store command failed");
    }

    return result.result;
  }
}

let defaultStore: RateLimitStore | null = null;

function getDefaultStore(): RateLimitStore {
  if (defaultStore) {
    return defaultStore;
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    defaultStore = new UpstashRateLimitStore(redisUrl, redisToken);
    return defaultStore;
  }

  if (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_IN_MEMORY_RATE_LIMIT_FALLBACK === "true"
  ) {
    defaultStore = new MemoryRateLimitStore();
    return defaultStore;
  }

  throw new Error("Production rate limiting requires Upstash Redis settings");
}

function cleanKeyPart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9:._-]/g, "_").slice(0, 160);
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  const candidate = firstForwardedIp || request.headers.get("x-real-ip") || "";
  const normalized = candidate.trim();

  if (
    !normalized ||
    normalized.length > 80 ||
    /[\s,]/.test(normalized) ||
    !/^[a-zA-Z0-9:.%-]+$/.test(normalized)
  ) {
    return "unknown";
  }

  return normalized;
}

export async function rateLimit(
  input: RateLimitInput,
  store?: RateLimitStore
): Promise<RateLimitResult> {
  if (!store) {
    store = getDefaultStore();
  }
  const subject = input.userId
    ? `user:${cleanKeyPart(input.userId)}`
    : `ip:${cleanKeyPart(input.ip || "unknown")}`;
  const key = `rate-limit:${cleanKeyPart(input.route)}:${subject}`;
  const { count, ttl } = await store.increment(key, input.windowSeconds);
  const retryAfter = Math.max(1, ttl ?? input.windowSeconds);
  const remaining = Math.max(0, input.limit - count);

  return {
    success: count <= input.limit,
    limit: input.limit,
    remaining,
    retryAfter,
    reset: Math.ceil(Date.now() / 1000) + retryAfter,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers({
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  });

  if (result.reset) {
    headers.set("X-RateLimit-Reset", String(result.reset));
  }

  if (!result.success && result.retryAfter) {
    headers.set("Retry-After", String(result.retryAfter));
  }

  return headers;
}

export async function rateLimitResponse(
  input: RateLimitInput,
  store?: RateLimitStore
) {
  let result: RateLimitResult;

  try {
    result = await rateLimit(input, store);
  } catch (error) {
    console.error("[rate-limit] store error, failing open:", error);
    return null;
  }

  if (result.success) {
    return null;
  }

  return jsonError("Too many requests", "RATE_LIMITED", 429, {
    headers: rateLimitHeaders(result),
  });
}

export function resetMemoryRateLimitStoreForTests() {
  memoryCounters.clear();
  defaultStore = null;
}
