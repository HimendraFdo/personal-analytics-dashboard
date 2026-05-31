# Metric Tabs Implementation Handoff

## Coordinator Instruction

The coordinator agent must not write or change any code.

Its job is only to:

- Read the current repository state.
- Review the merged metric-tabs first slice.
- Produce scoped implementation plans as `.md` files.
- Assign work to specialist agents.
- Define sequencing, acceptance criteria, and validation steps.
- Prevent agents from overlapping or rewriting each other's work.

The coordinator agent should hand off coding tasks to implementation agents only.

## Current State

A first metric-tabs slice has already been implemented and merged in PR #15:

https://github.com/HimendraFdo/personal-analytics-dashboard/pull/15

Branch used:

```text
codex/time-first-tracking
```

Commit:

```text
116df88 Add metric tabs time tracking slice
```

## Changes Already Implemented

### 1. Metric Data Model

Entries now support a metric discriminator:

```ts
metricType: "time" | "money" | "calories";
value: number;
```

The existing `value` field was preserved.

The Prisma `Entry` model now includes:

```prisma
metricType String @default("time")
```

A migration was added:

```text
prisma/migrations/20260528105000_add_entry_metric_type/migration.sql
```

Existing entries default to:

```text
metricType = "time"
```

### 2. Central Metric Config

A shared metric config module was added:

```text
lib/metrics.ts
```

It defines:

- Supported metric types
- Labels
- Units
- Accent colors
- Form input labels
- Sort labels
- Value formatters

Current metrics:

```ts
time
money
calories
```

Time values are formatted as minutes:

```text
45 min
```

Money and Calories have config placeholders but are not fully implemented yet.

### 3. URL-Based Metric Selection

A hook was added:

```text
hooks/useMetricSelection.ts
```

It reads and updates the active metric using the URL query param:

```text
/dashboard?metric=time
/entries?metric=money
/analytics?metric=calories
```

Invalid or missing metric params default to:

```text
time
```

### 4. Top Bar Metric Tabs

The top bar now includes tabs for:

```text
Time
Money
Calories
```

The active tab:

- Updates the `metric` URL query param.
- Controls visible labels and formatting.
- Uses metric-specific active styling.

### 5. Time UI Changed From Hours To Minutes

Visible Time UI was updated from hours to minutes.

Examples:

- `Time Spent (hours)` became `Time Spent (minutes)`
- `Total Hours` became `Total Minutes`
- `Avg Hours / Day` became `Avg Minutes / Day`
- Entry badges now show values like `45 min`
- Analytics copy now refers to tracked time in minutes
- Chart tooltips use the metric formatter

### 6. API Filtering By Metric

The entries API now filters by active metric:

```text
/api/entries?metric=time
/api/entries?metric=money
/api/entries?metric=calories
```

For the first slice:

- Time works fully.
- Money and Calories are visible but mostly placeholder/empty-state experiences.

### 7. Validation Updated

Validation now supports:

- `metricType`
- Positive numeric values
- Defaulting `metricType` to `time`

Tests were updated for the new field.

## Validation Already Run

The following passed before merge:

```bash
npm run lint
npm test
npm run build
```

A browser check was attempted, but local browser navigation was blocked by:

```text
net::ERR_BLOCKED_BY_CLIENT
```

## Current Product Status

### Time

Implemented as the first working metric.

Expected behavior:

- Time tab is default.
- Entries are stored with `metricType = "time"`.
- Values are entered and displayed as minutes.
- Dashboard, Entries, and Analytics use Time labels and formatting.

### Money

Visible in the top bar, but not fully implemented.

Current expected behavior:

- Money tab changes URL to `?metric=money`.
- Money entries are filtered separately.
- If no Money entries exist, the UI shows empty states.
- Money-specific summaries and copy are not fully complete yet.

### Calories

Visible in the top bar, but not fully implemented.

Current expected behavior:

- Calories tab changes URL to `?metric=calories`.
- Calories entries are filtered separately.
- If no Calories entries exist, the UI shows empty states.
- Calories-specific summaries and copy are not fully complete yet.

## Recommended Agentic Workflow

### Coordinator Agent

Do not write or change code.

Responsibilities:

1. Inspect the merged first slice.
2. Confirm current behavior against this handoff.
3. Create separate `.md` task files for each specialist agent.
4. Keep Money and Calories work separated.
5. Define clear acceptance criteria.
6. Require validation after each implementation PR.
7. Prevent agents from renaming `value` or building separate CRUD systems.

## Suggested Specialist Agent Tasks

### Agent 1: Money Implementation Plan

Goal:

Fully implement the Money tab without disrupting Time.

Scope:

- Money-specific form copy.
- Money-specific dashboard labels.
- Money-specific analytics labels.
- Currency formatting everywhere.
- Money sort labels.
- Money empty states.
- Ensure Money entries save with `metricType = "money"`.

Expected labels:

- `Money Spent`
- `Total Spent`
- `Avg Spend / Day`
- `Spending Over Time`
- Values formatted like `$12.50`

Validation:

```bash
npm run lint
npm test
npm run build
```

Acceptance criteria:

- Time still works in minutes.
- Money values display as currency.
- Money entries do not appear in Time or Calories tabs.
- URL param controls Money tab consistently across Dashboard, Entries, and Analytics.

### Agent 2: Calories Implementation Plan

Goal:

Fully implement the Calories tab after Money is stable.

Scope:

- Calories-specific form copy.
- Calories-specific dashboard labels.
- Calories-specific analytics labels.
- Calorie formatting everywhere.
- Calories sort labels.
- Calories empty states.
- Ensure Calories entries save with `metricType = "calories"`.

Expected labels:

- `Calories Eaten`
- `Total Calories`
- `Avg Calories / Day`
- `Calories Over Time`
- Values formatted like `450 kcal`

Validation:

```bash
npm run lint
npm test
npm run build
```

Acceptance criteria:

- Time still works in minutes.
- Money still works as currency.
- Calories values display as kcal.
- Calories entries do not appear in Time or Money tabs.
- URL param controls Calories tab consistently across Dashboard, Entries, and Analytics.

### Agent 3: Cross-Metric QA Plan

Goal:

Verify that all three metric tabs work together.

Scope:

- Test tab switching.
- Test URL query params.
- Test add/edit/delete for each metric.
- Test filtering separation.
- Test dashboard summaries.
- Test analytics summaries and charts.
- Test empty states.
- Test mobile and desktop layout.

Validation:

```bash
npm run lint
npm test
npm run build
```

Manual QA checklist:

- `/dashboard` defaults to Time.
- `/dashboard?metric=time` shows Time.
- `/dashboard?metric=money` shows Money.
- `/dashboard?metric=calories` shows Calories.
- Invalid metric query defaults to Time.
- Add Entry link preserves current metric.
- Creating a Time entry stores `metricType = "time"`.
- Creating a Money entry stores `metricType = "money"`.
- Creating a Calories entry stores `metricType = "calories"`.
- Entries do not leak between tabs.

## Guardrails For All Agents

Do not:

- Rename the `value` database column.
- Build separate CRUD systems for Time, Money, and Calories.
- Remove the central metric config.
- Hard-code metric labels across many components.
- Break the Time tab while implementing Money or Calories.
- Mix unrelated design refactors into metric implementation PRs.
- Change auth, navigation, or unrelated dashboard architecture unless required.

Do:

- Keep changes small and reviewable.
- Use `metricType` as the discriminator.
- Keep `value` numeric.
- Format values through shared metric config.
- Preserve URL-based metric selection.
- Run validation before final handoff.

## Recommended PR Sequence

1. Money tab full implementation.
2. Calories tab full implementation.
3. Cross-metric QA and polish.
4. Optional: visual refinement of active metric themes.
5. Optional: future Prisma enum migration for `metricType`.

## Later Optional Improvements

These should not be part of the next immediate implementation unless explicitly requested:

- Convert `metricType` from `String` to Prisma enum.
- Add per-metric category sets.
- Add metric-specific goals.
- Add dashboard widgets unique to each metric.
- Add data import/export.
- Add richer chart labels and axis formatting.
- Add integration or E2E tests.
