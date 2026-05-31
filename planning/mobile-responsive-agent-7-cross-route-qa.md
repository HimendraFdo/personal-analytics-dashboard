# Agent 7 Task: Cross-Route Mobile QA

## Role

You are the final integration QA agent.

Verify the fully integrated responsive implementation. Make only small responsive fixes after documenting them.

## Required Skill

Use:

```text
build-web-apps:frontend-testing-debugging
browser:control-in-app-browser
```

## Goal

Prove that the complete website works on mobile and that desktop behavior has not regressed.

## Required Routes

Inspect:

```text
/dashboard?metric=time
/dashboard?metric=money
/dashboard?metric=calories
/entries?metric=time
/entries?metric=money
/entries?metric=calories
/analytics?metric=time
/analytics?metric=money
/analytics?metric=calories
/sign-in
/sign-up
```

## Required Viewports

```text
320x568
390x844
768x1024
1440x1000
```

## Required Interaction Loop

1. Load Dashboard on mobile.
2. Use mobile navigation to open Entries.
3. Switch metric tabs and confirm the query parameter changes.
4. Create a Time entry.
5. Edit the entry.
6. Filter the list.
7. Delete the entry.
8. Navigate to Analytics.
9. Verify charts or empty states.
10. Check sign-in and sign-up mobile layouts.
11. Repeat a desktop smoke pass.

## QA Checklist

- Page identity
- Meaningful rendered content
- No framework error overlay
- No relevant console errors or warnings
- No horizontal page overflow
- No clipped controls or text
- Touch controls remain usable
- Mobile navigation preserves the active metric
- Desktop sidebar still works
- Screenshot evidence for mobile and desktop

## Small Fix Policy

You may fix:

- Responsive Tailwind classes
- Spacing
- Wrapping
- Overflow
- Touch-target sizing

Escalate instead of changing:

- API behavior
- Database behavior
- Auth logic
- Analytics calculations
- Metric semantics
- Component architecture requiring broad rewrites

If a fix touches an owned file from another agent, record the reason in the final handoff.

## Required Validation

Run:

```bash
npm run lint
npm test
npm run build
```

## Final Handoff

Produce a QA report with:

1. Findings, if any.
2. Summary.
3. Environment and tested viewports.
4. Pass/fail checks.
5. Interaction loop evidence.
6. Files changed for any final fixes.
7. Commands and Browser APIs used.
8. Remaining risk.
9. Screenshots grouped at the end.

