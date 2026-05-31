# Security Agent 3: API Rate Limiting

## Objective

Add production-safe rate limiting to authenticated API routes so users and IPs cannot abuse write operations, data reads, or the external food search proxy.

This task should run after:

- Credential hygiene
- SQL injection and query safety audit
- Ownership enforcement and safer data access

## Context

This project is a Next.js app using:

- App Router route handlers
- Clerk authentication
- Prisma/PostgreSQL

Relevant API routes:

- `GET /api/entries`
- `POST /api/entries`
- `PATCH /api/entries/[id]`
- `DELETE /api/entries/[id]`
- `GET /api/food/search`

Rate limiting must work in production on serverless infrastructure. Do not rely only on in-memory counters for production behavior.

## Files To Inspect

- `app/api/entries/route.ts`
- `app/api/entries/[id]/route.ts`
- `app/api/food/search/route.ts`
- `middleware.ts`
- `lib/api-response.ts`
- `package.json`
- environment variable docs or `.env.example`
- tests

## Required Work

### 1. Choose A Production-Safe Limiter Store

Use a shared store suitable for serverless deployment.

Preferred options:

- Upstash Redis
- Vercel KV/Redis
- Another managed Redis provider already available to the project

Do not implement production rate limiting with a module-level `Map` alone. A memory fallback is acceptable only for tests or local development and must be clearly marked as non-production.

If adding a provider dependency, document required environment variables in `.env.example`.

### 2. Create A Shared Rate Limit Helper

Create a helper such as:

- `lib/rate-limit.ts`

The helper should support:

- route-specific limits
- keying by Clerk `userId`
- IP fallback for unauthenticated/pre-auth cases
- returning whether the request is allowed
- returning reset timing or retry-after information when available

Suggested API shape:

```ts
type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter?: number;
};
```

Keep the helper easy to mock in tests.

### 3. Define Route Limits

Use conservative initial limits:

```text
GET /api/entries: 60 requests per minute per user
POST /api/entries: 20 requests per minute per user
PATCH /api/entries/[id]: 30 requests per minute per user
DELETE /api/entries/[id]: 20 requests per minute per user
GET /api/food/search: 20 requests per minute per user
GET /api/food/search: 60 requests per minute per IP fallback
```

If the implementation supports windows more naturally in seconds, use equivalent windows.

### 4. Apply Limits In Route Handlers

Apply rate limits after auth when the route requires a user, using the authenticated Clerk `userId`.

For endpoints that also face external services, especially `/api/food/search`, include IP fallback protection as well.

Return a consistent error response:

```json
{
  "error": {
    "message": "Too many requests",
    "code": "RATE_LIMITED"
  }
}
```

Use status `429`.

Set headers when possible:

- `Retry-After`
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

Do not leak sensitive key details in responses.

### 5. Handle IP Extraction Carefully

Create a small helper for IP extraction.

Use trusted headers in this order:

- `x-forwarded-for`, first IP only
- `x-real-ip`

If no IP is available, use a safe fallback key such as `unknown`.

Normalize values so clients cannot create unlimited unique keys with comma-separated or malformed headers.

### 6. Add Tests

Add tests for:

- allowed request under limit
- blocked request over limit
- per-user isolation
- per-route isolation
- IP fallback behavior
- `429` response shape
- `Retry-After` header when available

If full route-handler tests are difficult, test the shared helper and any response wrapper separately, then document route-level coverage gaps.

### 7. Update Environment Documentation

Update `.env.example` with any required rate limiting variables, for example:

```env
UPSTASH_REDIS_REST_URL="https://example.upstash.io"
UPSTASH_REDIS_REST_TOKEN="placeholder"
```

Use the actual provider variable names chosen by the implementation.

Do not put real provider credentials in any tracked file.

### 8. Run Verification

Run:

```bash
npm test
npm run lint
npm run build
```

If provider credentials are not available locally, tests must mock the limiter store. The app should still build without real rate limit credentials if local fallback behavior is intentionally supported.

## Out Of Scope

Do not implement RLS.

Do not rotate credentials.

Do not change ownership semantics.

Do not add CSRF/origin protections.

Do not turn user-facing validation errors into rate-limit errors.

Do not rely on client-side throttling as a security control.

## Acceptance Criteria

The task is complete when:

- Every listed API route has server-side rate limiting.
- Write endpoints have stricter limits than read endpoints.
- `/api/food/search` has user-based and IP fallback protection.
- Rate limiting uses a shared production-safe store, or an explicit blocker is documented.
- `429` responses use the project's normal JSON error shape.
- Rate limit headers are set where possible.
- Tests cover success, failure, user isolation, and IP fallback.
- Required environment variables are documented with placeholders only.
- `npm test`, `npm run lint`, and `npm run build` pass, or exact blockers are documented.

## Final Report Format

Return a short report with:

```text
Summary:
- ...

Changed files:
- ...

Rate limits:
- GET /api/entries: ...
- POST /api/entries: ...
- PATCH /api/entries/[id]: ...
- DELETE /api/entries/[id]: ...
- GET /api/food/search: ...

Security checks:
- Production-safe limiter store: pass/fail
- Per-user limits: pass/fail
- IP fallback: pass/fail
- 429 response shape: pass/fail

Verification:
- npm test: pass/fail/not run
- npm run lint: pass/fail/not run
- npm run build: pass/fail/not run

Remaining risks or blockers:
- ...
```
