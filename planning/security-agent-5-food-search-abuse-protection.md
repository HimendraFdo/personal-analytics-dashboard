# Security Agent 5: Food Search Abuse Protection

## Objective

Harden `GET /api/food/search` so the app cannot be abused as an unrestricted proxy to Open Food Facts or used to generate excessive outbound traffic.

This task should run after:

- Credential hygiene
- SQL injection and query safety audit
- Ownership enforcement and safer data access
- API rate limiting
- CSRF, origin, and request hardening

## Context

The food search route calls Open Food Facts using a user-provided search query:

- `app/api/food/search/route.ts`

Current behavior:

- requires Clerk auth
- reads `q` from search params
- requires at least 2 characters
- sets fixed upstream params
- fetches `https://world.openfoodfacts.org/cgi/search.pl`
- returns normalized food results

This endpoint is read-only, but it can still be abused because it triggers server-side outbound requests.

## Files To Inspect

- `app/api/food/search/route.ts`
- `lib/nutrition.ts`
- `lib/api-response.ts`
- `lib/rate-limit.ts`, if created by the rate limiting agent
- tests

## Required Work

### 1. Confirm Rate Limiting Is Applied

Verify that `/api/food/search` has server-side rate limiting.

Expected protections:

- per-user limit for authenticated users
- IP fallback limit where practical

If the rate limit helper from the previous agent is unavailable, document the blocker and add a TODO in the final report. Do not invent a separate limiter just for this route unless the coordinator approves it.

### 2. Tighten Query Validation

Validate the `q` parameter before creating upstream request params.

Recommended rules:

```text
minimum length: 2 characters
maximum length: 80 characters
trim whitespace
reject control characters
reject empty or whitespace-only values
```

Do not over-sanitize normal food names. Queries like these should remain valid:

- `peanut butter`
- `café latte`
- `weet-bix`
- `oat milk 1L`
- `yogurt/strawberry`

Return `400 VALIDATION_ERROR` for invalid queries.

### 3. Normalize Queries For Caching And Limiting

Create a normalized query value:

- trim
- collapse repeated whitespace
- optionally lowercase for cache keys

Use the normalized query for:

- upstream `search_terms`
- cache keys, if cache is implemented
- logs, if logs are added

Never log full request headers or credentials.

### 4. Add An Upstream Fetch Timeout

Use `AbortController` to prevent long-running upstream requests.

Recommended timeout:

```text
5 seconds
```

If the timeout triggers, return:

```text
502 INTERNAL_ERROR
```

with a safe message such as:

```text
Food lookup failed
```

Do not expose upstream stack traces or raw response bodies.

### 5. Keep Upstream Parameters Fixed Server-Side

Ensure clients cannot control:

- `page_size`
- `fields`
- `action`
- `json`
- upstream host
- upstream path

The only client-controlled value should be the validated food search query.

Keep `page_size` modest, for example `8`.

### 6. Consider Short-Term Caching

If the platform supports it, keep or improve route-level caching for upstream responses.

Current route uses:

```ts
next: { revalidate: 60 * 60 * 24 }
```

Confirm this is still appropriate after adding timeout and validation.

Do not cache personalized data. Food search results are public and can be cached by normalized query.

### 7. Add Tests

Add tests for:

- missing query returns `400`
- one-character query returns `400`
- overlong query returns `400`
- control characters return `400`
- normal punctuation and accented characters are accepted
- upstream fetch receives only fixed server-controlled params plus validated query
- upstream timeout returns a safe error
- failed upstream response returns safe `502`

If route-level tests are difficult, extract validation/normalization into a small helper and unit test it.

### 8. Run Verification

Run:

```bash
npm test
npm run lint
npm run build
```

If build or tests require unavailable external services, mock `fetch` and document any blocker.

## Out Of Scope

Do not implement general API rate limiting unless the previous agent did not complete it and the coordinator explicitly asks.

Do not implement CSRF/origin checks for this GET route.

Do not change entry ownership behavior.

Do not implement RLS.

Do not expose more Open Food Facts fields without a product reason.

Do not allow clients to choose arbitrary upstream URLs or params.

## Acceptance Criteria

The task is complete when:

- `/api/food/search` has rate limiting or a documented dependency blocker.
- Query validation enforces minimum length, maximum length, and rejects control characters.
- Normal food names with punctuation/accented characters still work.
- Upstream fetch has a timeout.
- Upstream parameters remain fixed server-side.
- Upstream errors return safe responses without leaking raw internals.
- Tests cover validation, upstream parameter safety, and timeout/error behavior.
- `npm test`, `npm run lint`, and `npm run build` pass, or exact blockers are documented.

## Final Report Format

Return a short report with:

```text
Summary:
- ...

Changed files:
- ...

Food search checks:
- Rate limiting present: pass/fail/blocked
- Query validation: pass/fail
- Query normalization: pass/fail
- Upstream timeout: pass/fail
- Fixed upstream params: pass/fail

Verification:
- npm test: pass/fail/not run
- npm run lint: pass/fail/not run
- npm run build: pass/fail/not run

Remaining risks or blockers:
- ...
```
