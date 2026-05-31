# Agent 1 Task: Money Metric Implementation

## Role

You are an implementation agent. Make code changes only for the Money metric slice.

Do not implement Calories in this task. Do not refactor unrelated dashboard, auth, navigation, Prisma, or styling architecture.

## Context

The first metric-tabs slice is already merged. Time is the working baseline.

Important existing files:

- `lib/metrics.ts`
- `hooks/useMetricSelection.ts`
- `hooks/useEntries.ts`
- `components/dashboard/Topbar.tsx`
- `components/dashboard/EntryForm.tsx`
- `components/dashboard/EntriesSection.tsx`
- `components/dashboard/DashboardSection.tsx`
- `components/dashboard/AnalyticsSection.tsx`
- `components/dashboard/EntryList.tsx`
- `lib/api.ts`
- `lib/validation.ts`
- `app/api/entries/route.ts`
- `app/api/entries/[id]/route.ts`
- `types/entry.ts`

Existing data model:

```ts
metricType: "time" | "money" | "calories";
value: number;
```

Money must reuse `value` as the numeric amount and `metricType = "money"` as the discriminator.

## Goal

Fully implement the Money tab while preserving the existing Time behavior.

The Money tab should feel like a complete spending tracker, not a placeholder.

## Required Scope

Implement Money-specific behavior across:

- Entry form copy and placeholders.
- Dashboard summary labels.
- Entries page copy, empty states, list values, and sorting labels.
- Analytics summary labels, chart titles, chart tooltips, latest-entry copy, and empty states.
- API create/update flow so Money entries save with `metricType = "money"`.
- URL behavior so `?metric=money` controls the active metric consistently.

## Expected Money Labels

Use these labels where applicable:

- Form input label: `Money Spent`
- Dashboard total: `Total Spent`
- Dashboard average: `Avg Spend / Day`
- Analytics total: `Total Spent`
- Analytics average: `Avg Spend / Entry`
- Trend chart: `Spending Over Time`
- Sort high: `Highest Spend`
- Sort low: `Lowest Spend`
- Empty state heading: `No money entries yet`

Values must format as currency:

```text
$12.50
$1,250.00
```

Use the shared metric config for formatting. Do not hard-code currency formatting repeatedly across components.

## Known Current Gaps To Fix

These are the likely places Money still reads as generic or placeholder:

- `EntriesSection` currently says non-Time metrics are placeholders.
- `DashboardSection` currently derives labels as `Total Money` and `Avg Money / Day`.
- `AnalyticsSection` currently derives labels as `Total Money`, `Avg Money / Entry`, and `Money Over Time`.
- `EntryForm` has a generic title placeholder such as `Deep work session`; Money should use a spending-oriented placeholder.
- Form number input currently uses `step="1"`; Money should support decimal values, for example `12.50`.

## Constraints

Do not:

- Rename the `value` field.
- Add separate Money CRUD endpoints.
- Add a separate Money table.
- Remove or bypass `lib/metrics.ts`.
- Break the Time tab.
- Implement Calories-specific copy or behavior.
- Mix in unrelated design refactors.

Do:

- Keep `metricType` as the discriminator.
- Keep `value` numeric.
- Use `metricConfigs.money.formatValue`.
- Prefer extending central metric config if repeated per-metric labels are needed.
- Keep changes small and reviewable.

## Suggested Implementation Approach

1. Extend `MetricConfig` in `lib/metrics.ts` only if the existing config does not contain enough label fields to avoid scattered conditionals.
2. Update Money labels through shared config-driven code.
3. Update `EntryForm` so placeholders and numeric step are metric-aware.
4. Update `EntriesSection`, `DashboardSection`, and `AnalyticsSection` so Money copy no longer says placeholder or generic `Money`.
5. Confirm `useEntries` passes `metricType: activeMetric` on create/update and does not need a Money-specific path.
6. Add or update focused tests where existing validation/API/metric tests cover this behavior.

## Acceptance Criteria

- `/dashboard?metric=money` shows the Money tab active.
- `/entries?metric=money` shows Money-specific form copy and empty states.
- `/analytics?metric=money` shows Money-specific summary and chart labels.
- Creating a Money entry stores `metricType = "money"`.
- Money values display as currency everywhere user-visible.
- Decimal Money values such as `12.50` are accepted and displayed as `$12.50`.
- Money entries do not appear in Time or Calories tabs.
- Time still displays values in minutes and retains existing Time labels.

## Required Validation

Run:

```bash
npm run lint
npm test
npm run build
```

Also manually check:

```text
/dashboard
/dashboard?metric=money
/entries?metric=money
/analytics?metric=money
```

Final handoff must include:

- Files changed.
- Validation results.
- Any known gaps.
