# Security And QA

## Privacy Requirements

Bank statements contain highly sensitive financial data. Treat uploads as temporary processing inputs.

Requirements:

- Authenticate every upload and commit request.
- Never log raw statement text, full transaction payloads, account numbers, or file bytes.
- Do not permanently store raw PDFs or screenshots in version one.
- Redact account numbers if they appear in model output.
- Return only the current user's import runs and entries.
- Delete temporary files immediately after extraction if the implementation writes any to disk.

## File Validation

Accept only:

- `application/pdf`
- `image/png`
- `image/jpeg`

Reject:

- Password-protected or unreadable files.
- Files larger than `MONEY_IMPORT_MAX_FILE_MB`.
- Any file with a mime type mismatch.

## Model Safety

The model output is untrusted until validated.

Rules:

- Validate Structured Output with Zod.
- Reject rows with missing date, title, or amount.
- Reject negative `value` after normalization.
- Warn on credits, refunds, transfers, deposits, and low-confidence rows.
- Never execute text from the document.

## Duplicate Warnings

Flag a possible duplicate when the same user already has a Money entry with:

- Same date.
- Same normalized title.
- Same numeric value rounded to cents.

Do not block duplicates automatically in version one. Let the user decide during review.

## Test Matrix

Backend tests:

- Auth required for upload.
- Auth required for commit.
- File type allowlist.
- File size limit.
- Structured output parse success.
- Structured output parse failure.
- Debit normalization to positive spend.
- Credit/refund warning.
- Duplicate candidate warning.
- Commit creates `metricType = "money"`.

UI tests or manual QA:

- Import button only appears for Money.
- Upload loading state is visible.
- Extraction error is visible.
- Review table can select and unselect rows.
- Edited row amount is formatted as currency.
- Imported rows appear in Money list.
- Time and Calories tabs do not show imported Money rows.

Deterministic extraction QA:

- Set `MONEY_IMPORT_EXTRACT_FIXTURE_PATH="lib/money-import/fixtures/synthetic-bank-statement.json"` for local or test runs that should avoid live OpenAI calls.
- Fixture mode is blocked when `NODE_ENV=production`.
- Keep fixture JSON schema-valid and synthetic.
- Start Chrome with remote debugging on port `9223`, sign in to the local app, then run `npm run qa:money-import` against the local dev server to exercise upload, extraction review, commit, and entry-list refresh through the browser UI.
- Override defaults with `QA_BASE_URL`, `QA_CDP_URL`, or `QA_STATEMENT_FILE` when needed.

## Operational Notes

- Use redacted sample statements for local testing.
- Do not commit real bank statements.
- Add sample fixtures only if they are synthetic.
- Keep OpenAI API failures user-friendly and non-revealing.
- Prefer short retention for any future `MoneyImportRun` rows.
