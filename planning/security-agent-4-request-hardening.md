# Security Agent 4: CSRF, Origin, And Request Hardening

## Objective

Harden API request handling so authenticated browser sessions cannot be abused through cross-site mutation requests, malformed content types, or oversized payloads.

This task should run after:

- Credential hygiene
- SQL injection and query safety audit
- Ownership enforcement and safer data access
- API rate limiting

## Context

This project is a Next.js App Router application using Clerk authentication.

Primary mutation routes:

- `POST /api/entries`
- `PATCH /api/entries/[id]`
- `DELETE /api/entries/[id]`

Read-only routes:

- `GET /api/entries`
- `GET /api/food/search`

The goal is to reject suspicious browser-originated mutations before request bodies are parsed or database writes happen.

## Files To Inspect

- `app/api/entries/route.ts`
- `app/api/entries/[id]/route.ts`
- `middleware.ts`
- `lib/api-response.ts`
- `next.config.ts`
- `.env.example`
- tests

## Required Work

### 1. Create A Shared Request Security Helper

Create a helper such as:

- `lib/request-security.ts`

The helper should provide reusable checks for:

- allowed `Origin` / `Referer`
- JSON `Content-Type`
- maximum `Content-Length`
- safe response generation using `jsonError`

Keep the helper easy to unit test.

### 2. Configure Allowed Origins

Allowed origins should come from environment config, for example:

```env
APP_ORIGIN="http://localhost:3000"
```

For production, this should be the deployed site origin, for example:

```env
APP_ORIGIN="https://your-domain.example"
```

If multiple origins are needed, support a comma-separated variable:

```env
APP_ALLOWED_ORIGINS="http://localhost:3000,https://your-domain.example"
```

Document whichever variable is implemented in `.env.example`.

Do not hard-code only localhost.

### 3. Add Origin / Referer Validation To Mutations

Apply this to:

- `POST /api/entries`
- `PATCH /api/entries/[id]`
- `DELETE /api/entries/[id]`

Expected behavior:

- If `Origin` is present, it must match an allowed origin.
- If `Origin` is missing but `Referer` is present, the referer origin must match an allowed origin.
- If both are missing, decide intentionally:
  - either allow non-browser clients only if they use another trusted signal, or
  - reject mutation requests without origin information.

For this web app, prefer rejecting missing origin/referer on mutation routes unless it breaks a known legitimate flow.

Return:

```text
403 FORBIDDEN
```

with a consistent JSON error body.

### 4. Validate JSON Content Type Before Parsing

Apply this to mutation routes that parse JSON bodies:

- `POST /api/entries`
- `PATCH /api/entries/[id]`

Accept:

```text
application/json
application/json; charset=utf-8
```

Reject other content types with:

```text
415 UNSUPPORTED_MEDIA_TYPE
```

Do this before calling `request.json()`.

`DELETE /api/entries/[id]` does not need JSON content type unless it accepts a body.

### 5. Add Maximum Body Size Checks

Before parsing JSON, check `Content-Length`.

Recommended initial limit:

```text
16 KB
```

This is enough for entry forms while limiting abuse.

If `Content-Length` exceeds the limit, return:

```text
413 PAYLOAD_TOO_LARGE
```

If `Content-Length` is missing, continue but rely on validation and route-level limits. Do not read arbitrary large streams into memory beyond what Next.js already does.

### 6. Keep GET Routes Usable

Do not apply CSRF-style origin rejection to safe `GET` routes unless there is a specific reason.

`GET /api/food/search` should remain accessible to authenticated app users, with rate limiting and query validation handled by other agents.

### 7. Add Tests

Add tests for:

- valid origin mutation succeeds
- invalid origin mutation returns `403`
- missing origin/referer mutation returns intended result
- invalid JSON content type returns `415`
- oversized body returns `413`
- valid `application/json; charset=utf-8` is accepted
- `DELETE` does not require JSON content type when no body is used

If full route tests are difficult, unit test the shared request security helper and document any route coverage gap.

### 8. Run Verification

Run:

```bash
npm test
npm run lint
npm run build
```

If local environment variables are needed for allowed origins, document them in `.env.example` and use test-specific values in test setup.

## Out Of Scope

Do not implement rate limiting.

Do not implement RLS.

Do not rotate credentials.

Do not change ownership enforcement.

Do not add broad security headers; that is a separate task.

Do not break Clerk sign-in/sign-up routes.

## Acceptance Criteria

The task is complete when:

- Mutation routes reject untrusted origins.
- Mutation routes reject unsupported JSON content types before body parsing.
- Mutation routes reject oversized payloads before body parsing when `Content-Length` is present.
- Allowed origins are environment-configurable and documented.
- GET routes are not unnecessarily blocked.
- Tests cover allowed and rejected request cases.
- `npm test`, `npm run lint`, and `npm run build` pass, or exact blockers are documented.

## Final Report Format

Return a short report with:

```text
Summary:
- ...

Changed files:
- ...

Request hardening checks:
- Origin/referer validation: pass/fail
- JSON content type validation: pass/fail
- Body size limit: pass/fail
- Allowed origins documented: pass/fail

Verification:
- npm test: pass/fail/not run
- npm run lint: pass/fail/not run
- npm run build: pass/fail/not run

Remaining risks or blockers:
- ...
```
