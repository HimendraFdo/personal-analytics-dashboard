# Fix: Production Origin Validation (403 on All POST Requests)

## Problem

Every `POST` request to `/api/money/import` and `/api/money/import/[runId]/commit` returns **403 Forbidden** in production. The feature works on localhost but is completely broken on Vercel.

**Root cause:** `lib/request-security.ts` line 39 adds `VERCEL_URL` to the allowed origins list:

```ts
const vercelOrigin = parseOrigins(process.env.VERCEL_URL);
```

`VERCEL_URL` is automatically set by Vercel to the **deployment-specific** URL (e.g. `personal-analytics-dashboard-abc123def.vercel.app`). This URL changes with every deployment and is never the URL users actually visit.

When a user on `https://your-app.vercel.app` uploads a file, their browser sends:
```
Origin: https://your-app.vercel.app
```

But the allowed origins list only contains:
```
https://personal-analytics-dashboard-abc123def.vercel.app
```

They never match → 403.

Locally, `VERCEL_URL` is not set, so `configuredOrigins` is empty, and the code falls back to comparing against the request's own URL — which works fine. The bug is invisible until you deploy.

## File to Change

`lib/request-security.ts`

## What to Fix

Replace the use of `VERCEL_URL` with `VERCEL_PROJECT_PRODUCTION_URL`, which Vercel sets to the **stable** production URL (e.g. `your-app.vercel.app`) and does not change between deployments.

```ts
// Before (line 39)
const vercelOrigin = parseOrigins(process.env.VERCEL_URL);

// After
const vercelOrigin = parseOrigins(process.env.VERCEL_PROJECT_PRODUCTION_URL);
```

`VERCEL_PROJECT_PRODUCTION_URL` is a built-in Vercel system environment variable that contains the primary production domain without a protocol prefix (e.g. `your-app.vercel.app`). The existing `normalizeOrigin` helper already handles prepending `https://`, so no other changes are needed.

## Also Required: Set APP_ORIGIN for Custom Domains

If the app is served from a custom domain (not the default `.vercel.app` URL), `VERCEL_PROJECT_PRODUCTION_URL` won't match either. In that case, set the `APP_ORIGIN` environment variable in the Vercel project settings:

```
APP_ORIGIN=https://your-custom-domain.com
```

`APP_ORIGIN` is already read by `getConfiguredAllowedOrigins()` at line 38 and takes precedence.

## Verification

After deploying the fix:
1. Visit the app on the production URL.
2. Upload a bank statement.
3. The request should no longer return 403. Previously it failed before reaching any auth or business logic.
