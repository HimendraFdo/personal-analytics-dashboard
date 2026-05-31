# Security Agent 1: SQL Injection And Query Safety

## Objective

Audit and harden database query usage so user-controlled input cannot become unsafe SQL.

This task should run after credential hygiene is complete and before broader ownership, rate limiting, or RLS work.

## Context

This project is a Next.js app using Prisma with PostgreSQL.

Current API surfaces include:

- `GET /api/entries`
- `POST /api/entries`
- `PATCH /api/entries/[id]`
- `DELETE /api/entries/[id]`
- `GET /api/food/search`

The app already uses Zod validation and Prisma query builders in key routes. Preserve that pattern.

## Files To Inspect

- `app/api/entries/route.ts`
- `app/api/entries/[id]/route.ts`
- `app/api/food/search/route.ts`
- `lib/**/*.ts`
- `prisma/schema.prisma`
- `prisma/migrations/**/*.sql`
- `*.test.ts`

## Required Work

### 1. Search For Unsafe Raw SQL

Run searches for:

```bash
rg -n "\$queryRaw|\$queryRawUnsafe|\$executeRaw|\$executeRawUnsafe|Prisma.sql|sql`|SELECT |INSERT |UPDATE |DELETE "
```

Review every match.

If any unsafe raw Prisma calls exist, remove them:

- Replace `$queryRawUnsafe` with Prisma query builder calls where possible.
- Replace `$executeRawUnsafe` with Prisma query builder calls where possible.
- If raw SQL is genuinely required, use Prisma's parameterized tagged-template form only.

Do not build SQL strings with user-controlled values.

### 2. Preserve Allow-Listed Query Options

Review these inputs:

- `sort`
- `category`
- `metric`
- route param `id`

Requirements:

- `sort` must remain allow-listed through `sortSchema`.
- `category` must remain allow-listed through `ENTRY_CATEGORIES`.
- `metric` must remain allow-listed through metric parsing/validation.
- Never pass arbitrary client strings into Prisma `orderBy`, model names, field names, or raw SQL.

### 3. Validate Entry IDs Before Database Access

In `app/api/entries/[id]/route.ts`, validate `id` as a UUID before querying Prisma.

Recommended implementation:

- Add or reuse a Zod UUID schema in `lib/validation.ts`.
- In `PATCH` and `DELETE`, parse `context.params.id`.
- Return a consistent `400 VALIDATION_ERROR` for invalid IDs.

Do not let invalid UUID input fall through into a generic `500`.

### 4. Add A Static Guard Against Unsafe Prisma APIs

Add a test that fails if application code contains:

- `$queryRawUnsafe`
- `$executeRawUnsafe`

The guard should scan relevant source files, not `node_modules`, `.next`, or generated output.

Recommended test location:

- `lib/security.test.ts`

Keep the test simple and deterministic.

### 5. Add Route/Validation Tests For Injection-Like Inputs

Add or update tests to cover:

- malicious `sort` values are rejected
- malicious `category` values are rejected
- invalid UUID route params return `400`
- entry `title` and `note` can safely contain SQL-looking text such as `' OR 1=1 --`

The expected behavior is not to strip harmless text fields. Text should be stored as data, not treated as SQL.

### 6. Run Verification

Run:

```bash
npm test
npm run lint
```

If tests require environment setup that is unavailable, document the exact blocker and run the narrowest possible affected tests instead.

## Out Of Scope

Do not implement rate limiting.

Do not implement row level security.

Do not rotate credentials.

Do not redesign authentication.

Do not make broad database schema changes except for adding validation helpers or tests.

Do not remove support for legitimate punctuation in user text fields.

## Acceptance Criteria

The task is complete when:

- No unsafe raw Prisma calls exist in application code.
- User-controlled input is not used to construct SQL, field names, or `orderBy` values.
- Invalid entry IDs return `400 VALIDATION_ERROR`.
- SQL-looking strings in normal text fields are accepted as data.
- Static tests fail on future use of `$queryRawUnsafe` or `$executeRawUnsafe`.
- `npm test` and `npm run lint` pass, or blockers are documented exactly.

## Final Report Format

Return a short report with:

```text
Summary:
- ...

Changed files:
- ...

Security checks:
- Unsafe raw SQL audit: pass/fail
- UUID route param validation: pass/fail
- Static unsafe Prisma guard: pass/fail

Verification:
- npm test: pass/fail/not run
- npm run lint: pass/fail/not run

Remaining risks or blockers:
- ...
```
