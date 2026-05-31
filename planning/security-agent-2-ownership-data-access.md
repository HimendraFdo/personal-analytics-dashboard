# Security Agent 2: Ownership Enforcement And Safer Data Access

## Objective

Make cross-user access impossible at the application layer by ensuring every entry read, update, and delete is scoped to the authenticated Clerk `userId`.

This task should run after:

- Credential hygiene
- SQL injection and query safety audit

It should run before RLS, because RLS should be a database-level safety net on top of correct application behavior.

## Context

This project is a Next.js app using:

- Clerk authentication
- Prisma
- PostgreSQL

The main protected model is `Entry`.

Current schema:

```prisma
model Entry {
  id     String  @id @default(uuid()) @db.Uuid
  userId String?
  ...
}
```

The nullable `userId` is a security risk for user-owned data. New entries are created with `userId`, but the schema still permits orphaned rows.

## Files To Inspect

- `app/api/entries/route.ts`
- `app/api/entries/[id]/route.ts`
- `lib/entries.ts`
- `lib/validation.ts`
- `prisma/schema.prisma`
- `prisma/migrations/**/*.sql`
- existing tests in `lib/*.test.ts`
- any API route tests if present

## Required Work

### 1. Audit All Entry Access

Search for all Prisma entry operations:

```bash
rg -n "prisma\.entry\.(findMany|findFirst|findUnique|create|update|updateMany|delete|deleteMany|upsert|count|aggregate|groupBy)"
```

For every operation, confirm whether it needs user ownership scoping.

Rules:

- Reads for user data must include `userId`.
- Updates for user data must include `userId`.
- Deletes for user data must include `userId`.
- Creates must set `userId` from Clerk auth, never from the request body.

### 2. Remove Unsafe Two-Step Mutations

In `app/api/entries/[id]/route.ts`, avoid this pattern:

```ts
const existing = await prisma.entry.findFirst({ where: { id, userId } });
await prisma.entry.update({ where: { id }, data });
```

The final mutation only targets `id`, so future edits could accidentally weaken ownership enforcement.

Use one of these safer patterns:

Option A, preferred if the Prisma schema supports compound uniqueness:

```prisma
@@unique([id, userId])
```

Then update/delete with a compound unique selector.

Option B, safe and simpler:

```ts
const result = await prisma.entry.updateMany({
  where: { id, userId },
  data,
});
```

Then fetch the updated row with `{ id, userId }` if the response needs the updated object.

For delete:

```ts
const result = await prisma.entry.deleteMany({
  where: { id, userId },
});
```

Return `404` if `result.count === 0`.

### 3. Make `userId` Required

Change Prisma schema from:

```prisma
userId String?
```

to:

```prisma
userId String
```

Before applying the migration, handle existing rows:

- If orphaned entries are disposable demo data, delete rows where `userId IS NULL`.
- If orphaned entries must be preserved, create a clear migration/backfill plan and stop for coordinator review.

Do not guess ownership for orphaned rows.

### 4. Ensure Request Body Cannot Override Ownership

Review create and update schemas.

Requirements:

- `userId` must not be accepted in `createEntrySchema`.
- `userId` must not be accepted in `updateEntrySchema`.
- If a client sends `userId`, it must be ignored or rejected.

Prefer rejecting unknown keys if that matches the existing validation style. If changing Zod objects to `.strict()`, verify the frontend still works.

### 5. Add Or Update Tests

Add tests proving:

- unauthenticated create/read/update/delete fails
- user A cannot update user B's entry
- user A cannot delete user B's entry
- user A cannot read user B's entries
- create always stores the authenticated `userId`
- request body `userId` cannot change ownership

If route-level tests are not currently set up, add focused tests around extracted helper functions or document the missing test harness and add the closest practical coverage.

### 6. Run Verification

Run:

```bash
npm test
npm run lint
npm run build
```

If build requires unavailable database access, document the exact failure and run the strongest local substitute.

## Out Of Scope

Do not implement RLS.

Do not implement rate limiting.

Do not rotate credentials.

Do not add CSRF/origin checks.

Do not redesign the auth flow.

Do not infer ownership for existing orphaned database rows.

## Acceptance Criteria

The task is complete when:

- Every user-owned `Entry` read, update, and delete is scoped by authenticated `userId`.
- No mutation performs an ownership check and then mutates by `id` alone.
- `Entry.userId` is required in the Prisma schema, or a blocker/backfill decision is documented.
- Request bodies cannot set or change entry ownership.
- Cross-user access tests pass.
- `npm test`, `npm run lint`, and `npm run build` pass, or exact blockers are documented.

## Final Report Format

Return a short report with:

```text
Summary:
- ...

Changed files:
- ...

Ownership checks:
- Reads scoped by userId: pass/fail
- Updates scoped by userId: pass/fail
- Deletes scoped by userId: pass/fail
- Request body cannot set ownership: pass/fail
- Entry.userId required or blocker documented: pass/fail

Verification:
- npm test: pass/fail/not run
- npm run lint: pass/fail/not run
- npm run build: pass/fail/not run

Remaining risks or blockers:
- ...
```
