# Fix: `maxDuration = 60` Is Silently Clamped to 10s on Vercel Hobby Plan

## Problem

The import route sets a 60-second function timeout:

```ts
// app/api/money/import/route.ts line 14
export const maxDuration = 60;
```

Vercel's **Hobby plan** hard-caps serverless functions at **10 seconds**. Vercel does not reject this at build time or warn you — it silently clamps the value and kills the function after 10 seconds regardless.

An OpenAI call processing a multi-page PDF or image can easily take 15–30 seconds. When Vercel kills the function mid-flight:

- The `finally` block that deletes the uploaded OpenAI file likely does not run → the file is leaked in your OpenAI account.
- The client receives a raw **504 Gateway Timeout** from Vercel's infrastructure, not a JSON error from the app.
- The user sees a broken request with no useful message.

## File to Change

`app/api/money/import/route.ts`

## What to Fix

### Option A — Upgrade to Vercel Pro (Recommended)

Vercel Pro raises the serverless function limit to 300 seconds. No code change needed beyond confirming the plan. `maxDuration = 60` will be respected as-is.

### Option B — Stay on Hobby, reduce timeout and add a client-side warning

If staying on Hobby, lower `maxDuration` to 10 to match the actual ceiling, and add a timeout on the OpenAI call so the app can return a clean error before Vercel kills it:

```ts
// app/api/money/import/route.ts
export const maxDuration = 10;
```

Then wrap the OpenAI call in `lib/money-import/statement-reader.ts` with an `AbortSignal` timeout:

```ts
// lib/money-import/statement-reader.ts — inside readStatement()
response = await client.responses.parse(
  {
    model: process.env.OPENAI_MONEY_IMPORT_MODEL ?? "gpt-4o-mini",
    input: [{ role: "user", content }],
    text: {
      format: zodTextFormat(
        statementExtractionProviderSchema,
        "statement_extraction"
      ),
    },
  },
  { signal: AbortSignal.timeout(8000) }  // 8s — leaves 2s for the rest of the handler
);
```

With this in place, if OpenAI takes too long, the `AbortSignal` fires, the `catch` block wraps it as a `Statement extraction provider request failed:` error, and the app returns a clean 502 to the client instead of a raw 504 from Vercel.

## How to Check Which Plan You're On

In the Vercel dashboard: **Settings → Billing**. If you're on Hobby, the function timeout is 10 seconds and cannot be raised without upgrading.

You can also confirm the effective timeout by checking Vercel's function logs — if a request is killed by the platform rather than the app, the log entry will show a timeout error from the infrastructure layer rather than your application code.

## Verification

After applying the fix:
1. Upload a large or complex bank statement.
2. If the OpenAI call exceeds the timeout, the response should be a clean JSON 502 (`EXTRACTION_PROVIDER_ERROR`) rather than a raw 504.
3. Verify the Vercel function log shows the error originating from app code, not the platform.
