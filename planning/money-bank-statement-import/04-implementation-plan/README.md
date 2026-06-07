# Implementation Plan

## Agent 1: Backend Extraction

Files to create:

- `lib/money-import/types.ts`
- `lib/money-import/extraction-schema.ts`
- `lib/money-import/intake.ts`
- `lib/money-import/statement-reader.ts`
- `lib/money-import/normalize.ts`
- `app/api/money/import/route.ts`

Tasks:

- Add `openai` dependency.
- Add `OPENAI_API_KEY` and `MONEY_IMPORT_MAX_FILE_MB` to `.env.example`.
- Validate authentication with Clerk server helpers, matching existing API route patterns.
- Validate upload mime type and size.
- Send PDF as `input_file` and images as vision input.
- Return structured draft rows.
- Add unit tests for schema validation and normalization.

Done when:

- A supported sample file returns reviewable draft rows.
- Unsupported file types are rejected.
- No draft is committed to `Entry` during extraction.

## Agent 2: Commit Flow

Files to create or update:

- `lib/money-import/review.ts`
- `lib/money-import/commit.ts`
- `app/api/money/import/[runId]/commit/route.ts`
- `lib/entries.ts` if shared creation helpers are needed.

Tasks:

- Revalidate selected draft ids server-side.
- Check duplicates for same user, date, normalized title, and value.
- Create `Entry` records with `metricType = "money"`.
- Keep category as `Finance` for version one.
- Add API tests for authenticated commit and user isolation.

Done when:

- Selected drafts become Money entries.
- Unselected drafts are not saved.
- Another user cannot commit a run they do not own.

## Agent 3: Money UI

Files likely to update:

- `components/dashboard/EntryForm.tsx`
- `components/dashboard/EntriesSection.tsx`
- New import button and review table components under `components/dashboard/`.

Tasks:

- Add `Import statement` action only for active Money metric.
- Add upload state, extraction loading state, error state, and review state.
- Add editable draft rows with checkboxes.
- Use `metricConfigs.money.formatValue` for amounts.
- Submit selected drafts to commit endpoint.

Done when:

- Manual Money entry still works.
- Statement import appears only for Money.
- Imported entries appear in the Money entries list after commit.

## Agent 4: QA And Hardening

Files likely to update:

- `lib/money-import/*.test.ts`
- `app/api/money/import/*.test.ts`
- `README.md` or `DEMO_SCRIPT.md` if product documentation needs an import walkthrough.

Tasks:

- Test happy path extraction with a mocked OpenAI response.
- Test malformed model output.
- Test duplicate warning logic.
- Test unsupported mime type.
- Test file too large.
- Test unauthenticated upload and commit.
- Run full validation.

Commands:

```bash
npm run lint
npm test
npm run build
```

Manual checks:

```text
/entries?metric=money
/dashboard?metric=money
/analytics?metric=money
```

## Suggested Build Order

1. Backend extraction with mocked OpenAI tests.
2. Normalization and review warnings.
3. Commit endpoint.
4. Money UI upload and review table.
5. End-to-end manual QA with a small redacted statement.
