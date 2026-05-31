# Mobile Responsive Coordinator Plan

## Goal

Scale the Personal Analytics Dashboard to mobile devices without regressing the current desktop experience.

The finished product must work across:

- Auth pages
- Dashboard
- Entries
- Analytics
- Time, Money, and Calories metric tabs

## Coordinator Role

The coordinator agent must not write application code.

Its responsibilities are:

1. Read the repository state and this plan.
2. Assign each specialist agent exactly one task brief.
3. Require each implementation agent to work on a separate branch.
4. Merge work in the sequence below.
5. Resolve ownership conflicts before work starts.
6. Require validation evidence before accepting a handoff.
7. Assign final cross-route mobile QA only after implementation branches are integrated.

## Current Responsive State

The app already has partial responsive Tailwind classes:

- `DashboardLayout` uses mobile and desktop padding.
- Dashboard and analytics cards already collapse to fewer columns.
- Auth pages already switch from one column to two columns at `lg`.
- Entries filters already collapse into a single column.

The largest known gap is navigation:

- `Sidebar` is hidden below `md`.
- There is no mobile replacement for Dashboard, Entries, and Analytics navigation.

Additional likely mobile risks:

- `Topbar` becomes tall and crowded on narrow screens.
- Card padding, large headings, and `rounded-[2rem]` surfaces consume too much space on phones.
- Entry list action controls can compress content.
- Recharts axes and formatted Money labels can overflow.
- Clerk auth forms and the auth marketing panel need narrow-screen verification.

## Target Viewports

Use these viewports throughout implementation:

| Name | Width | Height | Purpose |
| --- | ---: | ---: | --- |
| Small phone | 320 | 568 | Minimum supported width and worst-case wrapping |
| Standard phone | 390 | 844 | Primary mobile acceptance viewport |
| Tablet | 768 | 1024 | Breakpoint transition and sidebar boundary |
| Desktop | 1440 | 1000 | Desktop regression check |

## Delivery Sequence

### Phase 0: Baseline

Assign:

```text
planning/mobile-responsive-agent-0-baseline-audit.md
```

Do not start implementation until the audit agent has produced a route-by-route mismatch ledger.

### Phase 1: Shared App Shell

Assign and merge in order:

```text
planning/mobile-responsive-agent-1-shell-navigation.md
planning/mobile-responsive-agent-2-topbar.md
```

These tasks establish mobile navigation and compact header behavior used by all authenticated routes.

### Phase 2: Route Surfaces

After Phase 1 is merged, assign these agents in parallel:

```text
planning/mobile-responsive-agent-3-dashboard.md
planning/mobile-responsive-agent-4-entries.md
planning/mobile-responsive-agent-5-analytics-charts.md
planning/mobile-responsive-agent-6-auth.md
```

Each agent owns a separate component group. They must not edit files owned by another active agent.

### Phase 3: Cross-Route QA

After all Phase 2 branches are integrated, assign:

```text
planning/mobile-responsive-agent-7-cross-route-qa.md
```

The QA agent verifies the integrated site and may make only small, clearly documented responsive fixes.

## Branch Convention

Use one branch per implementation brief:

```text
codex/mobile-shell-navigation
codex/mobile-topbar
codex/mobile-dashboard
codex/mobile-entries
codex/mobile-analytics
codex/mobile-auth
codex/mobile-cross-route-qa
```

The baseline audit is documentation-only and may use:

```text
codex/mobile-baseline-audit
```

## File Ownership Matrix

| Agent | Primary ownership |
| --- | --- |
| Agent 0 | Baseline screenshots and `planning/mobile-responsive-baseline-report.md` |
| Agent 1 | `layouts/DashboardLayout.tsx`, `components/dashboard/Sidebar.tsx`, new mobile navigation component if needed |
| Agent 2 | `components/dashboard/Topbar.tsx` |
| Agent 3 | `components/dashboard/DashboardSection.tsx`, `components/dashboard/SummaryCard.tsx` |
| Agent 4 | `components/dashboard/EntriesSection.tsx`, `components/dashboard/EntryForm.tsx`, `components/dashboard/EntryList.tsx` |
| Agent 5 | `components/dashboard/AnalyticsSection.tsx`, `components/dashboard/ActivityTrendChart.tsx`, `components/dashboard/CategoryTotalsChart.tsx`, `components/dashboard/ChartSkeleton.tsx` |
| Agent 6 | `components/auth/AuthShell.tsx`, `components/auth/SignUpWithDisplayName.tsx`, `components/auth/authAppearance.ts` |
| Agent 7 | Integrated mobile QA; small fixes only after reporting ownership |

Shared files such as `app/globals.css`, `constants/navigation.ts`, and package files are coordinator-controlled. An agent may edit one only after recording why it is necessary in its handoff and confirming no other active agent is editing it.

## Product Guardrails

- Preserve desktop behavior.
- Do not change API, Prisma, auth flow, or metric data behavior.
- Preserve `?metric=time`, `?metric=money`, and `?metric=calories` while navigating.
- Keep primary mobile controls at least approximately 44px tall where practical.
- Avoid horizontal page scrolling at 320px width.
- Prefer CSS responsiveness over JavaScript viewport detection.
- Do not add a dependency unless the coordinator approves it.
- Use the existing Tailwind responsive patterns.

## Required Validation Per Implementation Agent

Run:

```bash
npm run lint
npm test
npm run build
```

For rendered changes, use the Browser plugin and the `build-web-apps:frontend-testing-debugging` workflow.

At minimum, verify:

```text
/dashboard?metric=time
/entries?metric=money
/analytics?metric=calories
/sign-in
/sign-up
```

Use the routes relevant to the assigned brief plus one desktop regression route.

## Final Definition Of Done

- Dashboard, Entries, and Analytics are reachable on phones without the desktop sidebar.
- No tested route has horizontal page overflow at 320px or 390px.
- Topbar actions remain usable on small screens.
- Entries can be created, edited, filtered, and deleted on mobile.
- Charts render without clipped containers or unreadable overflow.
- Auth flows remain usable on narrow screens.
- Metric tabs remain usable and preserve the metric query parameter.
- `npm run lint`, `npm test`, and `npm run build` pass on the integrated branch.

