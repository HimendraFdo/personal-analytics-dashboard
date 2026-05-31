# Security Agent 8: Security Regression Test Suite

## Objective

Build a focused security regression suite that proves the protections implemented by the earlier agents work together and continue to work after future feature changes.

This is the final implementation task. It should run after:

- Credential hygiene
- SQL injection and query safety audit
- Ownership enforcement and safer data access
- API rate limiting
- CSRF, origin, and request hardening
- Food search abuse protection
- Security headers
- PostgreSQL Row Level Security

## Context

This project is a Next.js App Router application using:

- Clerk authentication
- Prisma
- PostgreSQL on Neon
- Zod validation
- Vitest

Relevant API routes:

- `GET /api/entries`
- `POST /api/entries`
- `PATCH /api/entries/[id]`
- `DELETE /api/entries/[id]`
- `GET /api/food/search`

This agent should test and tighten existing security behavior. Do not redesign the implementation unless a test exposes a real defect.

## Files To Inspect

- `app/api/entries/route.ts`
- `app/api/entries/[id]/route.ts`
- `app/api/food/search/route.ts`
- `lib/validation.ts`
- `lib/request-security.ts`, if present
- `lib/rate-limit.ts`, if present
- RLS helper created by the previous agent
- `prisma/schema.prisma`
- `prisma/migrations/**/*.sql`
- `next.config.ts`
- existing `*.test.ts`
- `.gitignore`
- `.env.example`
- CI workflow files under `.github/workflows`, if present

## Required Work

### 1. Inventory Existing Security Coverage

List which protections already have automated tests:

- authentication
- ownership isolation
- SQL injection safety guard
- route param UUID validation
- rate limiting
- origin/referer validation
- JSON content type validation
- body size limit
- food search query validation
- upstream food search timeout
- security headers
- RLS behavior
- secret hygiene

Add missing tests where practical.

### 2. Add Authentication Tests

Prove unauthenticated requests cannot use protected routes:

```text
GET /api/entries -> 401
POST /api/entries -> 401
PATCH /api/entries/[id] -> 401
DELETE /api/entries/[id] -> 401
GET /api/food/search -> 401
```

Mock Clerk auth cleanly. Do not require real Clerk credentials.

### 3. Add Ownership Isolation Tests

Using two distinct user IDs, prove:

- user A sees only user A entries
- user A cannot patch user B's entry
- user A cannot delete user B's entry
- create stores the authenticated user ID
- request-body `userId` cannot override ownership

Expected behavior for cross-user mutations:

```text
404 NOT_FOUND
```

Prefer not to reveal whether another user's row exists.

### 4. Add Input Validation And SQL Safety Tests

Test:

- invalid UUID path param returns `400 VALIDATION_ERROR`
- invalid sort returns `400 VALIDATION_ERROR`
- invalid category returns `400 VALIDATION_ERROR`
- invalid metric returns the intended safe behavior
- SQL-looking title and note values are treated as ordinary text

Example text payload:

```text
' OR 1=1 --
```

Do not strip legitimate text merely because it resembles SQL.

Add or keep a static test that fails if application source contains:

```text
$queryRawUnsafe
$executeRawUnsafe
```

### 5. Add Rate Limit Tests

Mock the shared limiter store.

Prove:

- requests under limit succeed
- requests above limit return `429 RATE_LIMITED`
- rate limit response includes `Retry-After` when available
- user A quota does not consume user B quota
- route-specific limits remain independent
- food search uses IP fallback where implemented

Do not call a live Redis provider from unit tests.

### 6. Add Request Hardening Tests

For entry mutation routes, prove:

- allowed origin succeeds
- untrusted origin returns `403`
- missing origin/referer follows the intentional policy
- `application/json` succeeds
- `application/json; charset=utf-8` succeeds
- unsupported content type returns `415`
- body over configured limit returns `413`
- `DELETE` without a body does not require JSON content type

### 7. Add Food Search Abuse Tests

Mock `fetch`.

Prove:

- missing `q` returns `400`
- one-character query returns `400`
- overlong query returns `400`
- control characters return `400`
- normal punctuation and accented characters are accepted
- upstream params remain fixed server-side
- upstream host/path cannot be controlled by the client
- upstream timeout returns safe `502`
- upstream error body is not leaked

### 8. Add Security Header Tests

Test the header builder or Next config behavior.

Confirm:

- `Content-Security-Policy` exists
- `X-Content-Type-Options` is `nosniff`
- `Referrer-Policy` is present
- `Permissions-Policy` is present
- clickjacking protection exists through `X-Frame-Options` or CSP `frame-ancestors`
- HSTS is enabled only for production
- production CSP does not accidentally inherit development-only allowances

### 9. Add RLS Integration Tests

Run RLS tests against PostgreSQL, ideally a disposable Neon development branch or a dedicated test database.

Prove at the database layer:

- user A can select their own rows
- user A cannot select user B's rows
- user A cannot update user B's rows
- user A cannot delete user B's rows
- insert fails if row `userId` does not match transaction context
- missing RLS context cannot access `Entry`
- switching from user A context to user B context does not leak state

If CI cannot run live Postgres integration tests yet:

- place them behind an explicit integration test command
- document required environment variables
- keep unit/static coverage active in normal CI
- report the integration coverage gap clearly

### 10. Add Secret Hygiene Guard

Add a safe CI/static check that fails if tracked source files contain obvious committed secrets.

At minimum, check for:

```text
sk_test_
sk_live_
postgresql://
DATABASE_URL="postgresql://
```

Allow placeholder values in `.env.example`.

Do not read or print ignored local `.env` values during tests.

Also confirm `.env` is not tracked:

```bash
git ls-files .env
```

Expected output: empty.

### 11. Add Or Update CI

If GitHub Actions already exists, ensure it runs:

```bash
npm ci
npm run lint
npm test
npm run build
```

If an RLS integration suite is separate, add a documented command such as:

```bash
npm run test:integration
```

Do not add production secrets directly to workflow files.

### 12. Run Verification

Run:

```bash
npm test
npm run lint
npm run build
git ls-files .env
```

Run the RLS integration suite if test database access is available.

## Out Of Scope

Do not rotate credentials.

Do not make unrelated UI changes.

Do not weaken security behavior to make tests pass.

Do not require real Clerk credentials in unit tests.

Do not require live Redis access in unit tests.

Do not print secrets in test output.

## Acceptance Criteria

The task is complete when:

- Security regression tests cover authentication, ownership, validation, rate limiting, request hardening, food search abuse protections, headers, and secret hygiene.
- RLS has live integration coverage or a clearly documented integration-test command and blocker.
- Unit tests mock Clerk, Redis, and upstream fetch where appropriate.
- Tests do not expose or print secret values.
- `.env` is not tracked.
- CI runs lint, tests, and build.
- `npm test`, `npm run lint`, and `npm run build` pass, or exact blockers are documented.

## Final Report Format

Return a short report with:

```text
Summary:
- ...

Changed files:
- ...

Security coverage:
- Authentication: pass/fail
- Ownership isolation: pass/fail
- SQL safety and validation: pass/fail
- Rate limiting: pass/fail
- Origin/content type/body size: pass/fail
- Food search abuse protection: pass/fail
- Security headers: pass/fail
- RLS integration: pass/fail/blocked
- Secret hygiene guard: pass/fail
- CI coverage: pass/fail

Verification:
- npm test: pass/fail/not run
- npm run lint: pass/fail/not run
- npm run build: pass/fail/not run
- npm run test:integration: pass/fail/not run
- git ls-files .env: empty/not empty

Remaining risks or blockers:
- ...
```
