# API And Data Contract

## Environment Variables

Add these to `.env.example` when implementing:

```text
OPENAI_API_KEY=
MONEY_IMPORT_MAX_FILE_MB=10
```

## Dependencies

Version one should add:

```bash
npm install openai
```

Do not add `@openai/agents` until the repo is ready to move from Zod v3 to Zod v4.

## Upload Endpoint

```http
POST /api/money/import
Content-Type: multipart/form-data
```

Request fields:

```text
file: File
```

Response:

```ts
{
  runId: string;
  status: "requires_review";
  fileName: string;
  summary: {
    totalRows: number;
    importableRows: number;
    warningRows: number;
    duplicateCandidateRows: number;
  };
  drafts: MoneyImportDraft[];
  warnings: string[];
}
```

## Commit Endpoint

```http
POST /api/money/import/:runId/commit
Content-Type: application/json
```

Request:

```ts
{
  draftIds: string[];
}
```

Response:

```ts
{
  importedEntryIds: string[];
  skippedDraftIds: string[];
}
```

## Core Types

```ts
export type ExtractedTransaction = {
  sourceRowId: string;
  date: string | null;
  description: string | null;
  amount: number | null;
  currency: string | null;
  direction: "debit" | "credit" | "unknown";
  confidence: number;
  warnings: string[];
};
```

```ts
export type MoneyImportDraft = {
  id: string;
  date: string;
  title: string;
  value: number;
  category: "Finance";
  note: string;
  confidence: number;
  duplicateCandidate: boolean;
  warnings: string[];
};
```

```ts
export type RejectedImportRow = {
  sourceRowId: string;
  reason: string;
  rawDescription?: string;
};
```

## Structured Output Schema

The LLM response must be constrained to a schema equivalent to:

```ts
{
  accountName?: string;
  statementPeriodStart?: string;
  statementPeriodEnd?: string;
  currency: string;
  transactions: ExtractedTransaction[];
  warnings: string[];
}
```

Validate the model output again with Zod before returning it to the client.

## Persistence Decision

Version one can keep import drafts in memory only if the endpoint extracts and returns the review payload in one request. If drafts need to survive refreshes, add a dedicated import table later:

```prisma
model MoneyImportRun {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String
  fileName  String
  status    String
  drafts    Json
  createdAt DateTime @default(now())
  expiresAt DateTime

  @@index([userId])
  @@index([expiresAt])
}
```

Do not store raw statement files in the database.
