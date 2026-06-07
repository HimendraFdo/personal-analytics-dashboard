# Agentic Workflow

## Workflow Shape

Use a small, explicit server-side workflow instead of a single prompt hidden inside an API route. This gives the app an agentic structure without forcing an early dependency on the OpenAI Agents SDK.

## Agents

### 1. Intake Agent

Responsibilities:

- Validate file type and size.
- Identify whether the upload is a PDF or image.
- Create an extraction run id for logging and review.
- Prepare the file for the OpenAI request.

Output:

```ts
{
  runId: string;
  fileKind: "pdf" | "image";
  originalFileName: string;
  mimeType: string;
}
```

### 2. Statement Reader Agent

Responsibilities:

- Send the PDF or screenshot to the OpenAI Responses API.
- Ask for transaction extraction only.
- Require Structured Outputs.
- Preserve uncertainty instead of guessing.

Output:

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

### 3. Normalization Agent

Responsibilities:

- Convert extracted transaction rows into app-ready Money entry drafts.
- Normalize dates to ISO `YYYY-MM-DD`.
- Convert debits/spending to positive Money `value` amounts.
- Mark refunds, credits, or income as warnings for user review.
- Attach source metadata in the note.

Output:

```ts
{
  drafts: MoneyImportDraft[];
  rejectedRows: RejectedImportRow[];
}
```

### 4. Review Agent

Responsibilities:

- Flag low-confidence rows.
- Flag possible duplicates using same user, same date, same normalized title, and same value.
- Return user-facing warnings.

Output:

```ts
{
  drafts: MoneyImportDraft[];
  summary: {
    totalRows: number;
    importableRows: number;
    warningRows: number;
    duplicateCandidateRows: number;
  };
}
```

### 5. Commit Agent

Responsibilities:

- Accept selected draft ids from the user.
- Revalidate every selected row server-side.
- Create normal Money entries.
- Return imported entry ids.

Output:

```ts
{
  importedEntryIds: string[];
  skippedDraftIds: string[];
}
```

## Recommended File Layout

```text
lib/money-import/
  extraction-schema.ts
  intake.ts
  statement-reader.ts
  normalize.ts
  review.ts
  commit.ts
  types.ts

app/api/money/import/route.ts
app/api/money/import/[runId]/commit/route.ts
```

## Prompting Rules

The Statement Reader prompt must say:

- Extract only bank transactions.
- Do not infer missing dates, merchants, or amounts.
- Return uncertain rows with lower confidence and warnings.
- Treat debits/card purchases as spending.
- Treat refunds, credits, transfers, and deposits as non-spending unless the statement clearly marks them as fees or purchases.
- Use the exact schema.

## Human In The Loop

The model never writes directly to `Entry`. The user must review and explicitly import selected rows.

## Future Agents SDK Migration

After upgrading the app to Zod v4, this workflow can move to `@openai/agents`:

- Each agent above becomes an `Agent`.
- Duplicate lookup and commit become typed tools.
- Tracing can provide run-level debugging.
- Human review remains required before commit.
