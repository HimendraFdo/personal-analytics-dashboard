# Money Bank Statement Import

## Goal

Add a Money metric feature that lets a signed-in user upload a bank statement PDF or screenshot, extract transactions with an LLM-backed workflow, review the parsed transactions, and save selected rows as `metricType = "money"` entries.

## Recommended Technical Choice

Use the official OpenAI JavaScript SDK as the first implementation path:

- `openai` for file/image extraction through the Responses API.
- Existing `zod` validation for app-side schema checks.
- Prisma `Entry` records for accepted transactions.

OpenAI's file input docs support PDF inputs by file upload or base64, and vision-capable models can also process screenshots. OpenAI Structured Outputs should be used so the model returns a strict transaction schema instead of free-form text.

Do not start with `@openai/agents` in this repo. The current app depends on Zod v3, while the OpenAI Agents SDK TypeScript docs currently require Zod v4. Keep the first version dependency-light, then consider `@openai/agents` after a deliberate Zod upgrade.

## User Flow

1. User opens the Money metric.
2. User clicks `Import statement`.
3. User uploads a PDF, PNG, JPG, or JPEG.
4. Server stores the upload temporarily for the extraction request.
5. Extraction workflow reads the statement and returns normalized transactions.
6. User reviews transactions in a draft table.
7. User selects rows to import.
8. App creates Money entries through the existing entries API behavior.

## Source Of Truth

Money imports must still produce normal entries:

```ts
{
  metricType: "money",
  title: string,
  value: number,
  category: "Finance",
  date: string,
  note: string
}
```

The bank-statement import feature is an ingestion layer, not a separate ledger, table, or Money CRUD path.

## Readme Set

Build this feature from these files in order:

1. [Product README](./01-product-scope/README.md)
2. [Agentic Workflow README](./02-agentic-workflow/README.md)
3. [API And Data Contract README](./03-api-data-contract/README.md)
4. [Implementation Plan README](./04-implementation-plan/README.md)
5. [Security And QA README](./05-security-qa/README.md)

## External References

- OpenAI file inputs: https://platform.openai.com/docs/guides/pdf-files
- OpenAI image and vision inputs: https://platform.openai.com/docs/guides/images-vision
- OpenAI Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs
- OpenAI Agents SDK TypeScript: https://openai.github.io/openai-agents-js/
