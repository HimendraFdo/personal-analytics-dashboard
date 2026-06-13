# Fix: Import Warnings Are Silently Discarded on Every Save

## Problem

Warnings generated during a bank statement import (e.g. rejected rows, low-confidence extractions) are **silently dropped** after the initial response. If the user refreshes the review page, or if any code re-fetches the stored run, `warnings` is always `[]`.

**Root cause — two layers:**

**Layer 1:** The `MoneyImportRun` Prisma model has no `warnings` column (`prisma/schema.prisma` lines 43–54):

```prisma
model MoneyImportRun {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String
  fileName  String
  status    String
  drafts    Json
  createdAt DateTime @default(now())
  expiresAt DateTime
  // no warnings column
}
```

`saveMoneyImportRun` in `lib/money-import/store.ts` accepts `run.warnings` in its type signature and receives real data from the route — but the Prisma `create` call never includes it. The data is silently thrown away.

**Layer 2:** Even if a column existed, `toRun()` in `lib/money-import/store.ts` line 40 hardcodes the return value:

```ts
warnings: [],  // always empty, never reads from the DB row
```

## Files to Change

- `prisma/schema.prisma`
- `lib/money-import/store.ts`
- `prisma/migrations/` — a new migration is required

## What to Fix

### 1. Add `warnings` column to the Prisma schema

```prisma
// prisma/schema.prisma
model MoneyImportRun {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String
  fileName  String
  status    String
  drafts    Json
  warnings  Json     @default("[]")   // ← add this line
  createdAt DateTime @default(now())
  expiresAt DateTime

  @@index([userId])
  @@index([expiresAt])
}
```

### 2. Persist warnings in `saveMoneyImportRun`

```ts
// lib/money-import/store.ts — saveMoneyImportRun
const storedRun = await tx.moneyImportRun.create({
  data: {
    id: run.runId,
    userId: run.userId,
    fileName: run.fileName,
    status: "requires_review",
    drafts: run.drafts as Prisma.InputJsonValue,
    warnings: run.warnings as Prisma.InputJsonValue,  // ← add this line
    expiresAt: new Date(now.getTime() + RUN_TTL_MS),
  },
});
```

### 3. Read warnings back in `toRun`

The `toRun` function receives the raw DB row. Add `warnings` to its input type and read it back:

```ts
// lib/money-import/store.ts — toRun input type
function toRun(row: {
  id: string;
  userId: string;
  fileName: string;
  status: string;
  drafts: Prisma.JsonValue;
  warnings: Prisma.JsonValue;   // ← add this
  createdAt: Date;
  expiresAt: Date;
}): MoneyImportRun | null {
  const parsedDrafts = z.array(moneyImportDraftSchema).safeParse(row.drafts);
  if (!parsedDrafts.success) {
    return null;
  }

  const parsedWarnings = z.array(z.string()).safeParse(row.warnings);

  return {
    runId: row.id,
    userId: row.userId,
    fileName: row.fileName,
    drafts: parsedDrafts.data,
    warnings: parsedWarnings.success ? parsedWarnings.data : [],  // ← read from row
    createdAt: row.createdAt.getTime(),
    expiresAt: row.expiresAt.getTime(),
  };
}
```

### 4. Generate and run the migration

```bash
npx prisma migrate dev --name add-warnings-to-money-import-run
```

This creates the migration SQL file. Deploy it to production with:

```bash
npx prisma migrate deploy
```

The `vercel-build` script in `package.json` already runs `prisma migrate deploy` before the Next.js build, so deploying to Vercel will apply the migration automatically.

## Verification

1. Upload a bank statement that produces at least one rejected row or low-confidence transaction.
2. The initial response should include `warnings` as before.
3. Check the `MoneyImportRun` row in the database — the `warnings` column should be populated, not `[]`.
4. Re-fetch the run (or refresh the review UI) — warnings should still be present.
