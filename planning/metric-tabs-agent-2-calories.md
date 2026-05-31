# Agent 2 Task: Calories Metric Implementation

## Role

You are an implementation agent. Make code changes only for the Calories metric slice.

Start this task only after the Money implementation is merged or explicitly confirmed stable. Do not rewrite the Money work.

## Context

The first metric-tabs slice is already merged. Time is the baseline. Money should be implemented before this task starts.

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

Calories must reuse `value` as the numeric calorie count and `metricType = "calories"` as the discriminator.

## Goal

Fully implement the Calories tab while preserving Time and Money behavior.

The Calories tab should feel like a complete calorie tracker, not a placeholder.

## Required Scope

Implement Calories-specific behavior across:

- Entry form copy and placeholders.
- Dashboard summary labels.
- Entries page copy, empty states, list values, and sorting labels.
- Analytics summary labels, chart titles, chart tooltips, latest-entry copy, and empty states.
- API create/update flow so Calories entries save with `metricType = "calories"`.
- URL behavior so `?metric=calories` controls the active metric consistently.

## Expected Calories Labels

Use these labels where applicable:

- Form input label: `Calories Eaten`
- Dashboard total: `Total Calories`
- Dashboard average: `Avg Calories / Day`
- Analytics total: `Total Calories`
- Analytics average: `Avg Calories / Entry`
- Trend chart: `Calories Over Time`
- Sort high: `Highest Calories`
- Sort low: `Lowest Calories`
- Empty state heading: `No calories entries yet`

Values must format as:

```text
450 kcal
1,250 kcal
```

Use the shared metric config for formatting. Do not hard-code calorie formatting repeatedly across components.

## Known Current Gaps To Fix

These are the likely places Calories still reads as generic or placeholder:

- `EntriesSection` currently says non-Time metrics are placeholders.
- `DashboardSection` may derive generic labels instead of exact Calories labels.
- `AnalyticsSection` may derive generic labels instead of exact Calories labels.
- `EntryForm` has a generic title placeholder such as `Deep work session`; Calories should use a food-oriented placeholder.
- Formatting should include thousands separators if appropriate.

## Constraints

Do not:

- Rename the `value` field.
- Add separate Calories CRUD endpoints.
- Add a separate Calories table.
- Remove or bypass `lib/metrics.ts`.
- Break the Time or Money tabs.
- Rework Money implementation unless a shared-label adjustment is required and remains backward compatible.
- Mix in unrelated design refactors.

Do:

- Keep `metricType` as the discriminator.
- Keep `value` numeric.
- Use `metricConfigs.calories.formatValue`.
- Prefer extending central metric config if repeated per-metric labels are needed.
- Keep changes small and reviewable.

## Suggested Implementation Approach

1. Inspect the merged Money implementation and reuse any shared config pattern it introduced.
2. Add Calories-specific labels to `lib/metrics.ts` if needed.
3. Update form placeholders and numeric input behavior for Calories.
4. Update `EntriesSection`, `DashboardSection`, and `AnalyticsSection` so Calories copy no longer says placeholder or generic text.
5. Confirm `useEntries` passes `metricType: activeMetric` on create/update and does not need a Calories-specific path.
6. Add or update focused tests where existing validation/API/metric tests cover this behavior.

## Acceptance Criteria

- `/dashboard?metric=calories` shows the Calories tab active.
- `/entries?metric=calories` shows Calories-specific form copy and empty states.
- `/analytics?metric=calories` shows Calories-specific summary and chart labels.
- Creating a Calories entry stores `metricType = "calories"`.
- Calories values display as kcal everywhere user-visible.
- Calories entries do not appear in Time or Money tabs.
- Time still displays values in minutes.
- Money still displays values as currency.

## Required Validation

Run:

```bash
npm run lint
npm test
npm run build
```

Also manually check:

```text
/dashboard?metric=time
/dashboard?metric=money
/dashboard?metric=calories
/entries?metric=calories
/analytics?metric=calories
```

Final handoff must include:

- Files changed.
- Validation results.
- Any known gaps.
