# Fix: Rate Limiter Blocks All Requests in Production Without Upstash

## Problem

In production (`NODE_ENV === "production"`), if `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set, **every single request** to `/api/money/import` and `/api/money/import/[runId]/commit` immediately returns **429 Too Many Requests** — even on the very first call.

**Root cause:** `lib/rate-limit.ts` line 161:

```ts
throw new Error("Production rate limiting requires Upstash Redis settings");
```

When Upstash is not configured in production, `getDefaultStore()` throws. `rateLimitResponse` catches that exception (lines 232–239) and treats it as a rate limit being exceeded:

```ts
} catch {
  result = {
    success: false,   // ← exception is misread as "limit hit"
    limit: input.limit,
    remaining: 0,
    retryAfter: input.windowSeconds,
    ...
  };
}
```

`result.success === false` causes `rateLimitResponse` to return a 429 response. The import route checks this before any business logic runs, so the user never gets past it.

This means a missing environment variable causes **total denial of service** to your own users with no log message explaining why.

## File to Change

`lib/rate-limit.ts`

## What to Fix

Change the catch block in `rateLimitResponse` to distinguish between a store configuration error and a genuine rate limit hit. On a store error, **fail open** (allow the request) and log the error instead of blocking:

```ts
// Before (lines 230–240)
try {
  result = await rateLimit(input, store);
} catch {
  result = {
    success: false,
    limit: input.limit,
    remaining: 0,
    retryAfter: input.windowSeconds,
    reset: Math.ceil(Date.now() / 1000) + input.windowSeconds,
  };
}

// After
try {
  result = await rateLimit(input, store);
} catch (error) {
  console.error("[rate-limit] store error, failing open:", error);
  return null; // allow the request through
}
```

Failing open on a store error is the correct behaviour: a broken rate limiter should not take down the feature. The error is logged so it surfaces in Vercel's function logs.

## Also Required: Configure Upstash in Vercel (Recommended)

The in-memory fallback (`MemoryRateLimitStore`) does not work on Vercel serverless because each function invocation gets a fresh process — the counter resets to zero on every request. Rate limiting only works correctly in production with a persistent store.

Set these environment variables in your Vercel project settings:

```
UPSTASH_REDIS_REST_URL=https://your-upstash-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

Upstash has a free tier sufficient for this use case. Without it, rate limiting is silently ineffective — but with the fix above, at least the feature works.

## Verification

After deploying the fix (without Upstash configured):
1. Upload a bank statement on the production URL.
2. The request should no longer return 429 on the first attempt.
3. Check Vercel function logs — you should see the `[rate-limit] store error, failing open` message confirming the fallback is active.
