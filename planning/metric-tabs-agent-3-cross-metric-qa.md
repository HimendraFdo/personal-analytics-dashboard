# Agent 3 Task: Cross-Metric QA And Polish

## Role

You are a QA and polish agent. Your job is to verify that Time, Money, and Calories work together after the Money and Calories implementation PRs are merged.

Make only small fixes required to satisfy cross-metric correctness. Do not redesign the app or rewrite the metric architecture.

## Context

Expected completed sequence before this task:

1. Time metric first slice merged.
2. Money implementation merged.
3. Calories implementation merged.

The app should use one shared entry system:

```ts
metricType: "time" | "money" | "calories";
value: number;
```

There should not be separate CRUD systems per metric.

## Goal

Verify that all three metric tabs work together consistently across Dashboard, Entries, Analytics, API filtering, entry creation, entry editing, and entry deletion.

## Primary Files To Inspect

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
- Existing tests under `lib/*.test.ts` and `utils/*.test.ts`

## Manual QA Checklist

Navigation and URL behavior:

- `/dashboard` defaults to Time.
- `/dashboard?metric=time` shows Time.
- `/dashboard?metric=money` shows Money.
- `/dashboard?metric=calories` shows Calories.
- Invalid metric query values default to Time.
- Switching tabs updates the `metric` query param without losing the current page.
- The Add Entry link preserves the current metric query param.
- Direct navigation to `/entries?metric=money` keeps Money active.
- Direct navigation to `/analytics?metric=calories` keeps Calories active.

Entry creation:

- Creating a Time entry stores `metricType = "time"`.
- Creating a Money entry stores `metricType = "money"`.
- Creating a Calories entry stores `metricType = "calories"`.
- Time accepts positive numeric values and displays minutes.
- Money accepts decimal values such as `12.50` and displays currency.
- Calories accepts positive numeric values and displays kcal.
- Invalid, zero, and negative values show validation errors.

Entry isolation:

- Time entries do not appear in Money or Calories tabs.
- Money entries do not appear in Time or Calories tabs.
- Calories entries do not appear in Time or Money tabs.
- Editing an entry keeps it in the current metric unless the product intentionally supports metric changes.
- Deleting an entry removes only that entry and does not affect other metrics.

Dashboard:

- Time labels use minutes.
- Money labels use spending language and currency.
- Calories labels use calorie language and kcal.
- Totals and averages calculate only the active metric.
- Recent entries show active-metric formatting.
- Empty states are metric-specific and not placeholder copy.

Entries page:

- Form input label and placeholder match the active metric.
- Sort labels match the active metric.
- Entry list values use active-metric formatting.
- Empty state copy is complete for all three metrics.
- Category and date filters work inside the active metric only.

Analytics:

- Summary cards use active-metric labels and formatting.
- Category totals use active-metric values.
- Latest entry uses active-metric labels and formatting.
- Chart titles and tooltips match the active metric.
- Empty states are complete for all three metrics.

Responsive layout:

- Check desktop width.
- Check mobile width.
- Metric tabs remain usable and do not overlap other top-bar controls.
- Form labels, card titles, and formatted values do not overflow.

## Automated Validation

Run:

```bash
npm run lint
npm test
npm run build
```

If there is a browser testing setup available, also run a local browser smoke test for:

```text
/dashboard
/dashboard?metric=money
/entries?metric=money
/analytics?metric=calories
```

## Fix Scope

Allowed:

- Small label fixes.
- Small formatting fixes.
- Small config consolidation fixes.
- Missing test additions for cross-metric regressions.
- Minor responsive layout fixes if metric tabs or formatted values overflow.

Not allowed:

- Rebuilding the dashboard layout.
- Changing auth behavior.
- Replacing the metric selection architecture.
- Creating separate endpoints or tables per metric.
- Renaming `value`.
- Adding new product features such as goals, imports, exports, or per-metric category sets.

## Acceptance Criteria

- All three metric tabs are complete and consistent.
- URL query params control the active metric across Dashboard, Entries, and Analytics.
- Entries are isolated by `metricType`.
- Formatting is correct for all three metrics:
  - Time: `45 min`
  - Money: `$12.50`
  - Calories: `450 kcal`
- No placeholder copy remains for Money or Calories.
- `npm run lint`, `npm test`, and `npm run build` pass.

## Final Handoff

Report:

- Validation commands and results.
- Manual QA routes checked.
- Any fixes made.
- Any remaining risks or follow-up recommendations.
