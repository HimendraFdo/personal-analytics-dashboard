# Agent 5 Task: Mobile Analytics And Charts

## Role

You are the analytics and chart implementation agent.

Make analytics cards, breakdowns, and Recharts surfaces readable on mobile after shared shell work is merged.

## Owned Files

- `components/dashboard/AnalyticsSection.tsx`
- `components/dashboard/ActivityTrendChart.tsx`
- `components/dashboard/CategoryTotalsChart.tsx`
- `components/dashboard/ChartSkeleton.tsx`

## Goal

Ensure analytics content remains legible without horizontal overflow or clipped chart labels.

## Required Scope

1. Reduce mobile-only spacing and padding where needed.
2. Verify summary cards for Time, Money, and Calories.
3. Ensure breakdown rows wrap long values safely.
4. Tune Recharts margins, Y-axis width, tick formatting, or responsive presentation for small screens.
5. Verify empty states.
6. Verify chart skeletons match the mobile chart footprint.
7. Preserve desktop chart readability.

## Acceptance Criteria

- No horizontal page overflow at `320x568`.
- Both analytics charts render inside their containers at `390x844`.
- Money formatting does not clip axes or summary cards.
- Calories macro values remain readable.
- Empty states render cleanly.
- Desktop analytics remain readable at `1440x1000`.

## Constraints

- Do not change analytics calculations or metric config behavior.
- Do not edit Dashboard route files; Agent 3 owns them.
- Do not add chart dependencies.
- Keep Recharts.

## Validation

Run:

```bash
npm run lint
npm test
npm run build
```

Use Browser on:

```text
/analytics?metric=time
/analytics?metric=money
/analytics?metric=calories
```

Check populated and empty states where the available data permits.

## Handoff

Report:

- Files changed.
- Chart adjustments.
- Routes and viewports checked.
- Validation results.

