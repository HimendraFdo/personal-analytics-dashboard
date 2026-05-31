# Agent 3 Task: Mobile Dashboard Surface

## Role

You are the dashboard surface implementation agent.

Improve mobile layout density and wrapping on the Dashboard route after the shared shell and topbar are merged.

## Owned Files

- `components/dashboard/DashboardSection.tsx`
- `components/dashboard/SummaryCard.tsx`

## Goal

Make the dashboard readable and balanced on phones while preserving the desktop presentation.

## Required Scope

1. Audit the welcome hero at `320px` and `390px`.
2. Reduce mobile-only padding, heading size, and spacing where needed.
3. Ensure the four hero stats wrap cleanly.
4. Ensure summary cards do not clip formatted Money values.
5. Verify Calories macro cards at phone widths.
6. Verify the dashboard trend chart container remains usable.
7. Keep desktop visual hierarchy intact.

## Acceptance Criteria

- No horizontal page overflow at `320x568`.
- Hero heading, greeting, and stat tiles remain readable.
- `$1,250.00` and similar values wrap or fit without clipping.
- Calories macro cards remain readable.
- Dashboard cards use space efficiently on `390x844`.
- Desktop layout remains intact at `1440x1000`.

## Constraints

- Do not edit chart implementation files; Agent 5 owns them.
- Do not edit `Topbar.tsx`, shell files, API, or metric configuration.
- Keep changes responsive and presentation-only.

## Validation

Run:

```bash
npm run lint
npm test
npm run build
```

Use Browser on:

```text
/dashboard?metric=time
/dashboard?metric=money
/dashboard?metric=calories
```

Check phone and desktop widths.

## Handoff

Report:

- Files changed.
- Mobile density adjustments.
- Route and viewport evidence.
- Validation results.

