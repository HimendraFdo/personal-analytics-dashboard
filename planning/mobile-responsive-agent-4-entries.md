# Agent 4 Task: Mobile Entries Workflow

## Role

You are the Entries workflow implementation agent.

Make the full create, edit, filter, and delete interface usable on mobile after shared shell work is merged.

## Owned Files

- `components/dashboard/EntriesSection.tsx`
- `components/dashboard/EntryForm.tsx`
- `components/dashboard/EntryList.tsx`

## Goal

Ensure the most interaction-heavy route works comfortably on phones.

## Required Scope

1. Reduce mobile-only panel padding and spacing where needed.
2. Keep filters readable and easy to tap.
3. Verify form controls, validation text, and buttons at `320px`.
4. Verify Calories manual and Food Lookup mode controls.
5. Adjust entry list rows so title, metadata, badges, Edit, and Delete do not collide.
6. Ensure long titles, notes, values, and macro badges wrap safely.
7. Preserve the existing two-column layout on large screens.

## Acceptance Criteria

- No horizontal page overflow at `320x568`.
- A Time entry can be created and edited on a phone viewport.
- Filters and Clear Filters remain usable.
- Money values such as `$1,250.00` do not collide with row actions.
- Calories macro badges wrap without clipping.
- Delete remains reachable.
- Desktop Entries layout remains intact at `1440x1000`.

## Constraints

- Do not change API, validation rules, metric config, or data behavior.
- Do not edit shell, topbar, dashboard, analytics, or chart files.
- Preserve all existing entry modes and controls.

## Validation

Run:

```bash
npm run lint
npm test
npm run build
```

Use Browser on:

```text
/entries?metric=time
/entries?metric=money
/entries?metric=calories
```

Exercise at least one create, edit, filter, and delete interaction.

## Handoff

Report:

- Files changed.
- Interaction path tested.
- Mobile layout changes.
- Validation results.

