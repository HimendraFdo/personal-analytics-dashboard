# Agent 0 Task: Mobile Responsive Baseline Audit

## Role

You are the baseline audit agent. Do not change application code.

Produce a concrete mobile mismatch ledger that the implementation agents can use.

## Required Skill

Use:

```text
build-web-apps:frontend-testing-debugging
browser:control-in-app-browser
```

## Goal

Document the current responsive behavior before implementation starts.

## Scope

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

Test:

```text
320x568
390x844
768x1024
1440x1000
```

## Required Checks

- Page identity and meaningful content
- Missing mobile navigation
- Horizontal page overflow
- Clipped text or controls
- Overlapping elements
- Touch target sizing
- Metric tab wrapping and usability
- Entry form usability
- Entry list action layout
- Chart container overflow and axis readability
- Auth form layout
- Relevant console errors or warnings

## Deliverable

Create:

```text
planning/mobile-responsive-baseline-report.md
```

Include:

1. Environment and routes checked.
2. A table of findings ordered by severity.
3. Reproduction viewport and route for every finding.
4. Likely owning agent for each finding.
5. Screenshot evidence references.
6. A short desktop regression note.

## Constraints

- Do not edit application code.
- Do not add dependencies.
- Do not fix issues during the audit.
- Keep screenshots outside the repo unless the coordinator explicitly requests committed artifacts.

## Handoff

Report:

- Audit report path.
- Routes and viewport sizes checked.
- Browser API sequence used.
- Any route blocked by auth, environment, or runtime errors.

