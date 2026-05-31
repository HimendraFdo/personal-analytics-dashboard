# Security Agent 7: PostgreSQL Row Level Security

## Objective

Add PostgreSQL Row Level Security (RLS) as a database-level safety net so user-owned `Entry` rows cannot be read or mutated across users even if a future application query forgets a `userId` filter.

This task should run after:

- Credential hygiene
- SQL injection and query safety audit
- Ownership enforcement and safer data access
- API rate limiting
- CSRF, origin, and request hardening
- Food search abuse protection
- Security headers

## Context

This project uses:

- Next.js App Router
- Clerk authentication
- Prisma
- PostgreSQL on Neon

The protected model is:

```prisma
model Entry {
  id     String @id @default(uuid()) @db.Uuid
  userId String
  ...
}
```

RLS should complement application-layer ownership checks, not replace them.

Important Neon/Postgres note:

- Neon pooled connection strings use PgBouncer transaction pooling.
- Do not rely on session state set outside a transaction.
- If using `current_setting('app.current_user_id', true)` for policies, set that value inside the same database transaction as the protected queries.

Reference checked: Neon connection pooling docs note that Neon uses PgBouncer in transaction mode, where session settings are only valid for the transaction when set through pooled connections.

## Files To Inspect

- `prisma/schema.prisma`
- `prisma/migrations/**/*.sql`
- `lib/prisma.ts`
- `app/api/entries/route.ts`
- `app/api/entries/[id]/route.ts`
- `.env.example`
- deployment environment variables
- tests

## Required Work

### 1. Confirm Preconditions

Before implementing RLS, confirm:

- `Entry.userId` is required, not nullable.
- All app-layer `Entry` reads/writes/deletes are already scoped by authenticated Clerk `userId`.
- Existing orphan rows with `userId IS NULL` have been removed or intentionally handled.

If `Entry.userId` is still nullable, stop and report this blocker to the coordinator.

### 2. Design Least-Privilege Database Roles

Do not run the production app as a table owner or superuser-equivalent role.

Create or identify:

- an owner/admin role for migrations
- a runtime app role for the deployed application

Runtime app role requirements:

- no `BYPASSRLS`
- not the owner of the `Entry` table
- only has required privileges on app tables/sequences

Migration/admin role requirements:

- can run Prisma migrations
- can alter tables and policies

Document the intended role split and required environment variables:

```env
DATABASE_URL="runtime app role connection string"
DIRECT_DATABASE_URL="migration/admin role connection string if needed"
```

Use names that fit the existing Prisma/Neon setup.

### 3. Enable And Force RLS

Create a Prisma migration that enables and forces RLS on `Entry`:

```sql
ALTER TABLE "Entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entry" FORCE ROW LEVEL SECURITY;
```

Forcing RLS matters because table owners can otherwise bypass RLS.

### 4. Add RLS Policies

Use a transaction-local app setting to bind the authenticated user to the current database transaction.

Recommended policy shape:

```sql
CREATE POLICY entry_user_select ON "Entry"
FOR SELECT
USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY entry_user_insert ON "Entry"
FOR INSERT
WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY entry_user_update ON "Entry"
FOR UPDATE
USING ("userId" = current_setting('app.current_user_id', true))
WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY entry_user_delete ON "Entry"
FOR DELETE
USING ("userId" = current_setting('app.current_user_id', true));
```

If policy names already exist, make the migration idempotent or use Prisma's normal migration workflow carefully.

### 5. Set The Current User In Transactions

Create a safe Prisma helper so all `Entry` queries run in a transaction that sets the Clerk user id first.

Example direction:

```ts
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
  // protected tx.entry.* calls happen here
});
```

Important:

- use parameterized raw SQL only
- use `set_config(..., true)` so the setting is transaction-local
- do not use `$executeRawUnsafe`
- do not set the user id outside the transaction
- do not mix protected `Entry` queries outside this helper

Choose a helper name that matches the codebase, for example:

- `withUserDatabaseContext`
- `withEntryUserContext`
- `withRlsUserContext`

### 6. Update API Routes To Use The RLS Context

Update protected entry route handlers:

- `GET /api/entries`
- `POST /api/entries`
- `PATCH /api/entries/[id]`
- `DELETE /api/entries/[id]`

Requirements:

- keep existing app-layer `userId` filters
- run Prisma `Entry` operations inside the RLS user-context transaction
- preserve existing response behavior
- preserve validation and rate-limit behavior from earlier agents

### 7. Avoid RLS Context Leaks

Because pooled/serverless connections can be reused, tests and implementation must prove the user context does not leak between requests.

Use transaction-local settings only.

Do not use:

```sql
SET app.current_user_id = '...'
```

outside a transaction.

Do not rely on global Prisma client state to carry the current user.

### 8. Add Tests

Add tests for:

- user A can read their own entries
- user A cannot read user B's entries
- user A cannot update user B's entries
- user A cannot delete user B's entries
- insert fails if `userId` does not match current RLS context
- queries without an RLS context cannot access `Entry`
- switching from user A to user B does not leak context

If tests cannot run against a real Postgres database locally, create a documented integration-test plan and add the strongest available unit/static tests.

Static tests should also fail on:

- `$executeRawUnsafe`
- `$queryRawUnsafe`
- direct `prisma.entry.*` access outside approved helper/routes, if practical

### 9. Verify Against Neon Pooling

If the app uses a pooled Neon connection string with `-pooler` in the host, explicitly verify the RLS helper works with transaction pooling.

Checklist:

- `set_config(..., true)` is called in the same `$transaction` as the protected queries.
- No protected query runs before the context is set.
- No code assumes session settings survive after transaction commit.

### 10. Run Verification

Run:

```bash
npm test
npm run lint
npm run build
```

If applying migrations requires a live Neon branch, use a safe development branch first.

Recommended Neon workflow:

- create a Neon branch for RLS testing
- apply migrations there
- run integration tests
- only then apply to production

## Out Of Scope

Do not implement rate limiting.

Do not rotate credentials.

Do not change CSP/security headers.

Do not remove app-layer ownership checks.

Do not introduce unsafe raw SQL.

Do not run the production app using a table-owner role just to make RLS easier.

## Acceptance Criteria

The task is complete when:

- `Entry` has RLS enabled and forced.
- Policies exist for select, insert, update, and delete.
- The runtime app role does not bypass RLS.
- Protected `Entry` queries set the current user inside the same transaction as the query.
- Existing app-layer `userId` filters remain in place.
- Cross-user access fails at the database layer.
- Missing RLS context prevents access.
- Prisma code uses parameterized raw SQL only.
- Neon pooled-connection behavior has been accounted for.
- `npm test`, `npm run lint`, and `npm run build` pass, or exact blockers are documented.

## Final Report Format

Return a short report with:

```text
Summary:
- ...

Changed files:
- ...

Database/RLS checks:
- Entry RLS enabled: pass/fail
- Entry RLS forced: pass/fail
- SELECT policy: pass/fail
- INSERT policy: pass/fail
- UPDATE policy: pass/fail
- DELETE policy: pass/fail
- Runtime role does not bypass RLS: pass/fail/blocked
- User context set transaction-locally: pass/fail
- Neon pooling considered: pass/fail

Verification:
- npm test: pass/fail/not run
- npm run lint: pass/fail/not run
- npm run build: pass/fail/not run
- Migration tested on Neon branch: pass/fail/not run

Remaining risks or blockers:
- ...
```
