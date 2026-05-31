# Security Agent 0: Credential Hygiene

## Objective

Remove exposed secrets from the repository, rotate compromised credentials, and leave the project with a safe environment-variable workflow.

This is the first security task and should be completed before rate limiting, RLS, API hardening, or any other security work.

## Context

This project is a Next.js app using:

- Clerk for authentication
- Prisma with PostgreSQL
- Neon as the database provider

The local `.env` file currently contains real credentials. Treat every value in that file as compromised if it has been committed, shared, copied into logs, or exposed to an agent transcript.

## Files To Inspect

- `.env`
- `.gitignore`
- `package.json`
- `prisma/schema.prisma`
- `README.md`
- Vercel or hosting environment settings, if this app is deployed

## Required Work

### 1. Check Whether `.env` Is Tracked

Run:

```bash
git ls-files .env
```

If `.env` appears in the output, remove it from git tracking without deleting the local file:

```bash
git rm --cached .env
```

Do not delete the developer's local `.env`.

### 2. Confirm `.env` Is Ignored

Check `.gitignore`.

Ensure these patterns are present:

```gitignore
.env
.env.*
!.env.example
```

If needed, add them.

### 3. Rotate Exposed Credentials

Rotate every exposed secret, especially:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`

Use the provider dashboards:

- Neon dashboard: rotate the database password or create a new app database role.
- Clerk dashboard: rotate the secret key.

If the project is deployed, update the hosting provider's environment variables too.

Do not paste new secret values into markdown files, commit messages, chat responses, screenshots, or logs.

### 4. Create `.env.example`

Create or update `.env.example` with placeholder values only:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_or_pk_live_placeholder"
CLERK_SECRET_KEY="sk_test_or_sk_live_placeholder"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/dashboard"
```

### 5. Verify The App Still Works Locally

After updating local `.env`, run:

```bash
npm run lint
npm test
npm run build
```

If build requires a live database and fails because the database is not reachable, document the exact failure and verify with the strongest available alternative.

### 6. Check For Other Secret Leaks

Search the repo for likely secrets:

```bash
rg -n "DATABASE_URL|CLERK_SECRET_KEY|sk_test_|sk_live_|npg_|postgresql://|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
```

Expected result:

- Real secrets may appear only in local, ignored files.
- `.env.example` may contain placeholders.
- No real secret should appear in tracked source, docs, tests, logs, or planning files.

Also inspect recent logs if present:

- `next-dev.err.log`
- `next-dev.out.log`
- `next-start.err.log`
- `next-start.out.log`

Remove committed secret-bearing logs from tracking if needed. Do not delete local logs unless explicitly approved.

## Out Of Scope

Do not implement rate limiting.

Do not change API route behavior.

Do not implement RLS.

Do not refactor Prisma access patterns.

This agent's job is only credential hygiene and secret safety.

## Acceptance Criteria

The task is complete when:

- `.env` is not tracked by git.
- `.env` and `.env.*` are ignored, except `.env.example`.
- Exposed Neon and Clerk credentials have been rotated.
- `.env.example` exists and contains only placeholders.
- A repo search finds no real secrets in tracked files.
- Local verification commands have been run, or any blocker is documented with exact output.
- The final response lists changed files and confirms that no new secret values were disclosed.

## Final Report Format

Return a short report with:

```text
Summary:
- ...

Changed files:
- ...

Verification:
- ...

Credentials rotated:
- Neon DATABASE_URL: yes/no
- Clerk secret key: yes/no

Remaining risks or blockers:
- ...
```
