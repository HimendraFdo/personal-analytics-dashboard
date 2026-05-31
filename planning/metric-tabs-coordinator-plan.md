# Metric Tabs Coordinator Plan

## Goal

Restructure the dashboard around three top-bar metric tabs:

- Time
- Money
- Calories

The active tab changes the dashboard context, labels, units, colors, summaries, charts, entry form copy, and eventually the filtered data shown across Dashboard, Entries, and Analytics.

Start with the Time tab only. Time entries should be tracked in minutes, not as generic `value` and not as hours.

## Product Direction

Use one shared entry system with a metric discriminator:

```ts
metricType: "time" | "money" | "calories";
value: number;
```

Keep the existing `value` persistence field for now. Format it differently per metric:

- Time: `min`
- Money: currency
- Calories: `kcal`

This avoids building three separate CRUD systems.

## Recommended First PR Scope

Implement only the first slice:

1. Add metric tabs to the top bar: Time, Money, Calories.
2. Default the active tab to Time.
3. Make Time use minutes everywhere in visible UI.
4. Keep Money and Calories visible as placeholders or empty states.
5. Do not fully implement Money or Calories yet.

## Architecture Tasks

### 1. Metric Model

Inspect current entry types, validation, API routes, Prisma schema, and dashboard components.

Plan the smallest model change:

- Add `metricType`.
- Existing records default to `time`.
- Keep `value` as numeric.
- Do not rename the database column yet.

Recommended Prisma direction:

```prisma
metricType String @default("time")
```

Later this can become an enum.

### 2. Metric Config

Create a central metric config module so labels, colors, units, and formatting are not scattered across components.

Expected shape:

```ts
time: {
  label: "Time",
  unit: "min",
  accent: "teal",
  inputLabel: "Time Spent (minutes)"
}

money: {
  label: "Money",
  unit: "$",
  accent: "emerald",
  inputLabel: "Money Spent"
}

calories: {
  label: "Calories",
  unit: "kcal",
  accent: "orange",
  inputLabel: "Calories Eaten"
}
```

Include formatting helpers for each metric.

### 3. Active Metric State

Prefer URL query params for the active metric:

```text
/dashboard?metric=time
/entries?metric=time
/analytics?metric=time
```

Default to `time` when the param is missing or invalid.

Expected helper or hook:

```ts
const { activeMetric, setActiveMetric, metricConfig } = useMetricSelection();
```

## UI Tasks

### 4. Top Bar Tabs

Place Time, Money, and Calories tabs in the existing top bar.

The active tab should:

- Be visually clear.
- Update the URL query param.
- Control labels, units, formatting, and color theme.

Suggested color themes:

- Time: teal/blue
- Money: green/emerald
- Calories: orange/rose

### 5. Time Tab Copy

For the first implementation, update visible Time UI:

- `Time Spent (hours)` -> `Time Spent (minutes)`
- `Total Hours` -> `Total Minutes`
- `Avg Hours / Day` -> `Avg Minutes / Day`
- Entry badges should show `45 min`
- Analytics should say `total tracked time`
- Sort options should be `Highest Time` and `Lowest Time`

## Data Flow Tasks

### 6. Filter By Metric

Once `metricType` exists:

- Time tab shows `metricType = "time"`.
- Money tab shows `metricType = "money"`.
- Calories tab shows `metricType = "calories"`.

For the first PR:

- Time should work fully.
- Money and Calories can show empty states or placeholders.

### 7. API And Validation

Plan create/update validation:

- `metricType` required or defaulted to `time`.
- `value` remains numeric and positive.
- Existing tests should be updated for the new field.

Existing entries should migrate to:

```ts
metricType: "time"
```

## Later Stages

### Money

Implement after Time is stable.

Expected labels:

- Money Spent
- Total Spent
- Avg Spend / Day
- Spending Over Time
- Values formatted as currency, e.g. `$12.50`

### Calories

Implement after Money is stable.

Expected labels:

- Calories Eaten
- Total Calories
- Avg Calories / Day
- Calories Over Time
- Values formatted as `450 kcal`

## Recommended Agent Order

1. Architecture agent: schema and metric model.
2. UI foundation agent: metric config and tab behavior.
3. State agent: URL param or context helper.
4. Database/API agent: `metricType` migration and validation.
5. Frontend implementation agent: Time tab in minutes.
6. QA agent: tests, build, visual checks, regression checklist.
7. Money implementation agent.
8. Calories implementation agent.

## Coordinator Guardrails

- Keep PRs small and reviewable.
- Do not implement all three metrics in one PR.
- Preserve newer dashboard design work from `main`.
- Avoid renaming `value` in the database until the metric model is stable.
- Centralize metric labels, colors, units, and formatting before expanding Money and Calories.
- Run validation after each implementation slice:

```bash
npm run lint
npm test
npm run build
```
