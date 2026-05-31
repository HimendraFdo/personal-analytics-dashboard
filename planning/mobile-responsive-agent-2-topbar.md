# Agent 2 Task: Mobile Topbar

## Role

You are the topbar implementation agent.

Make the authenticated header compact and usable on mobile after Agent 1's shell work is merged.

## Owned File

- `components/dashboard/Topbar.tsx`

## Goal

Retain metric switching, page identity, search, Add Entry, and the Clerk user control without crowding narrow screens.

## Required Scope

1. Verify the three metric tabs fit at `320px`.
2. Make the header hierarchy compact on phones.
3. Keep the active page title visible.
4. Preserve the Add Entry action.
5. Keep the user button reachable.
6. Decide whether search should remain visible, collapse, or move below primary controls on phones.
7. Preserve the existing desktop layout at `lg`.

Use CSS breakpoints and semantic controls. Do not add JavaScript viewport detection.

## Acceptance Criteria

- Metric tabs remain usable for Time, Money, and Calories at `320x568`.
- Add Entry remains reachable without horizontal scrolling.
- User button remains reachable.
- Search does not force horizontal overflow.
- Header height is reasonable on `390x844`.
- Desktop header remains functionally equivalent at `1440x1000`.

## Constraints

- Do not edit shell or navigation files.
- Do not remove metric tabs.
- Do not change metric query behavior.
- Do not implement search behavior beyond layout changes; the current input is visual only.

## Validation

Run:

```bash
npm run lint
npm test
npm run build
```

Use Browser to validate all three metric tabs and Add Entry navigation at phone and desktop widths.

## Handoff

Report:

- Files changed.
- Mobile control hierarchy chosen.
- Metric tab and Add Entry evidence.
- Validation results.

