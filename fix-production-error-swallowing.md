# Fix: OpenAI Errors Are Swallowed as Generic 500 in Production

## Problem

When the OpenAI call fails in production — wrong API key, quota exceeded, model unavailable, malformed response — the user receives:

```json
{ "error": "Failed to extract statement", "code": "INTERNAL_ERROR" }
```

No detail. No indication of whether it's a configuration problem, a transient error, or a bad file. There is also no `console.error` before returning, so the real error is invisible in Vercel's function logs too.

**Root cause:** `app/api/money/import/route.ts` lines 232–244 gate actionable error responses behind `process.env.NODE_ENV !== "production"`:

```ts
if (
  message.startsWith("Statement extraction provider request failed:") &&
  process.env.NODE_ENV !== "production"   // ← never true in prod
) {
  return jsonError(message, "EXTRACTION_PROVIDER_ERROR", 502);
}

if (
  message === "Statement extraction returned invalid data" &&
  process.env.NODE_ENV !== "production"   // ← never true in prod
) {
  return jsonError(message, "EXTRACTION_VALIDATION_ERROR", 502);
}
```

Both branches are dead code in production. Both fall through to the catch-all 500 with no logging.

## File to Change

`app/api/money/import/route.ts`

## What to Fix

Remove the `NODE_ENV` guards and add a `console.error` before the catch-all so errors are always visible in logs. The original intent was probably to avoid leaking internal details to users — that's handled by returning a clean error code without the raw message in production.

```ts
// Before
if (
  message.startsWith("Statement extraction provider request failed:") &&
  process.env.NODE_ENV !== "production"
) {
  return jsonError(message, "EXTRACTION_PROVIDER_ERROR", 502);
}

if (
  message === "Statement extraction returned invalid data" &&
  process.env.NODE_ENV !== "production"
) {
  return jsonError(message, "EXTRACTION_VALIDATION_ERROR", 502);
}

return jsonError("Failed to extract statement", "INTERNAL_ERROR", 500);


// After
if (message.startsWith("Statement extraction provider request failed:")) {
  console.error("[money-import] provider error:", error);
  return jsonError(
    "Statement extraction failed. Please try again later.",
    "EXTRACTION_PROVIDER_ERROR",
    502
  );
}

if (message === "Statement extraction returned invalid data") {
  console.error("[money-import] invalid extraction data:", error);
  return jsonError(
    "Statement extraction returned unexpected data. Please try again.",
    "EXTRACTION_VALIDATION_ERROR",
    502
  );
}

console.error("[money-import] unexpected error:", error);
return jsonError("Failed to extract statement", "INTERNAL_ERROR", 500);
```

The user-facing message no longer contains raw internal detail (safe for production), but the real error is logged and visible in Vercel's function logs under the `[money-import]` prefix.

## Verification

After deploying:
1. Temporarily set `OPENAI_API_KEY` to an invalid value in Vercel.
2. Upload a bank statement.
3. The response should return a 502 with code `EXTRACTION_PROVIDER_ERROR` instead of a generic 500.
4. Vercel function logs should show the `[money-import] provider error:` line with the actual OpenAI error message.
5. Restore the correct `OPENAI_API_KEY`.
