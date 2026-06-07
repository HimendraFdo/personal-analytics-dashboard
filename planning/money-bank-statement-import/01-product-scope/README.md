# Product Scope

## Feature Summary

The Money metric gets an import workflow for bank statement documents. The workflow turns uploaded statements into editable Money entry drafts, then lets the user save only the transactions they approve.

## In Scope

- Upload one bank statement file at a time.
- Accept `.pdf`, `.png`, `.jpg`, and `.jpeg`.
- Extract transaction date, merchant/description, amount, currency, and confidence.
- Default imported category to `Finance`.
- Save approved transactions as existing `Entry` records with `metricType = "money"`.
- Show extraction status, errors, and a review table before saving.
- Avoid saving the raw bank statement permanently in version one.

## Out Of Scope For Version One

- Direct bank account connections.
- Multi-currency conversion.
- Automatic categorization beyond `Finance`.
- Duplicate detection across all historical data beyond simple same-date, same-title, same-amount warnings.
- Persistent document storage.
- Background jobs for very large files.

## UX Requirements

The Money tab should expose an `Import statement` action near the manual entry form or Money entries list.

The review screen should include:

- File name and extraction status.
- Count of transactions found.
- Warning count for low-confidence or possible duplicate rows.
- Editable transaction rows.
- Row selection before import.
- `Import selected` action.

Rows should show Money values with the existing `metricConfigs.money.formatValue` behavior.

## Acceptance Criteria

- A user can upload a supported statement file from the Money metric.
- The upload is rejected if the user is not authenticated.
- The upload is rejected if the file type or file size is unsupported.
- Extracted transactions are shown as drafts, not immediately saved.
- Approved rows create entries with `metricType = "money"`.
- Imported rows appear in the Money tab and do not appear in Time or Calories.
- The raw statement is not retained after extraction unless a later storage policy explicitly allows it.
