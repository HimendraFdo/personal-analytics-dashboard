# Agent 6 Task: Mobile Authentication Pages

## Role

You are the authentication presentation implementation agent.

Make sign-in and sign-up surfaces comfortable on phones without changing Clerk behavior.

## Owned Files

- `components/auth/AuthShell.tsx`
- `components/auth/SignUpWithDisplayName.tsx`
- `components/auth/authAppearance.ts`

## Goal

Ensure authentication is usable at small widths and does not waste most of the first mobile viewport on marketing content.

## Required Scope

1. Audit `/sign-in` and `/sign-up` at `320px` and `390px`.
2. Make the auth form the clear mobile priority.
3. Compact, reorder, or hide non-essential marketing content on phones where justified.
4. Verify Clerk form controls fit narrow screens.
5. Verify the custom display-name first step.
6. Preserve the desktop two-column auth presentation.

## Acceptance Criteria

- Sign-in form is reachable quickly on `320x568`.
- Sign-up display-name input and Continue button fit without overflow.
- Clerk UI fits inside its panel without horizontal scrolling.
- Desktop auth presentation remains intact at `1440x1000`.
- No Clerk flow behavior changes.

## Constraints

- Presentation-only changes.
- Do not modify Clerk routing, redirects, metadata, or authentication logic.
- Do not edit dashboard files.

## Validation

Run:

```bash
npm run lint
npm test
npm run build
```

Use Browser on:

```text
/sign-in
/sign-up
```

Check phone and desktop widths.

## Handoff

Report:

- Files changed.
- Mobile content priority decision.
- Routes and viewports checked.
- Validation results.

