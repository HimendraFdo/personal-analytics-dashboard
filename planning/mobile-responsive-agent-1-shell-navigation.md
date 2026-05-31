# Agent 1 Task: Mobile Shell And Navigation

## Role

You are the shared-shell implementation agent.

Implement a mobile navigation path for authenticated pages while preserving the existing desktop sidebar.

## Owned Files

- `layouts/DashboardLayout.tsx`
- `components/dashboard/Sidebar.tsx`
- A new mobile navigation component under `components/dashboard/` if needed

## Goal

Users on phones must be able to move between Dashboard, Entries, and Analytics.

## Required Scope

1. Preserve the desktop sidebar at `md` and above unless a small breakpoint adjustment is justified.
2. Add a compact mobile navigation pattern below `md`.
3. Reuse `MAIN_NAV_ITEMS`, `NAV_PATHS`, and the active route logic.
4. Preserve the active `metric` query parameter when navigating.
5. Ensure mobile navigation does not overlap page content.
6. Keep navigation touch targets practical for phones.

Recommended pattern:

```text
Bottom navigation bar with Dashboard, Entries, and Analytics
```

A bottom bar is preferred because the desktop sidebar disappears on mobile and there are only three primary destinations.

## Acceptance Criteria

- `/dashboard?metric=money` can navigate to `/entries?metric=money`.
- `/entries?metric=calories` can navigate to `/analytics?metric=calories`.
- Active route styling is visible.
- Navigation is usable at `320x568` and `390x844`.
- Content is not hidden behind the mobile navigation.
- Desktop sidebar remains visible and functional at `1440x1000`.

## Constraints

- Do not edit `Topbar.tsx`; Agent 2 owns it.
- Do not change auth, API, Prisma, or metric behavior.
- Do not add a menu library.
- If `constants/navigation.ts` must change, coordinate that edit before making it.

## Validation

Run:

```bash
npm run lint
npm test
npm run build
```

Use Browser to validate route navigation at phone and desktop widths.

## Handoff

Report:

- Files changed.
- Navigation pattern selected.
- Route and metric query preservation evidence.
- Validation results.
- Any follow-up needed from Agent 2.

