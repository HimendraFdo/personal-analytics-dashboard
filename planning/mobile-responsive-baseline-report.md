# Mobile Responsive Baseline Audit

## Environment

- Branch: `codex/mobile-responsive-scaling`
- App: Next.js development server at `http://localhost:3000`
- Audit date: `2026-05-31`
- Required viewports checked: `320x568`, `390x844`, `768x1024`, `1440x1000`
- Screenshot evidence: `C:\tmp\mobile-responsive-baseline`
- Screenshot artifacts are intentionally outside the repository.
- Authenticated QA account: Clerk development test user `mobile.qa+clerk_test@example.com`

## Routes Checked

The following route and viewport matrix was captured:

| Route | `320x568` | `390x844` | `768x1024` | `1440x1000` | Result |
| --- | --- | --- | --- | --- | --- |
| `/dashboard?metric=time` | Checked | Checked | Checked | Checked | Authenticated page rendered |
| `/dashboard?metric=money` | Checked | Checked | Checked | Checked | Authenticated page rendered |
| `/dashboard?metric=calories` | Checked | Checked | Checked | Checked | Authenticated page rendered |
| `/entries?metric=time` | Checked | Checked | Checked | Checked | Authenticated page rendered |
| `/entries?metric=money` | Checked | Checked | Checked | Checked | Authenticated page rendered |
| `/entries?metric=calories` | Checked | Checked | Checked | Checked | Authenticated page rendered |
| `/analytics?metric=time` | Checked | Checked | Checked | Checked | Authenticated page rendered |
| `/analytics?metric=money` | Checked | Checked | Checked | Checked | Authenticated page rendered |
| `/analytics?metric=calories` | Checked | Checked | Checked | Checked | Authenticated page rendered |
| `/sign-in` | Checked | Checked | Checked | Checked | Public page rendered |
| `/sign-up` | Checked | Checked | Checked | Checked | Public page rendered |

The authenticated protected-route matrix rendered successfully after the QA account was added. The account is intentionally empty, so populated entry-row actions and populated chart axes remain follow-up coverage.

## Findings

| Severity | Finding | Reproduction | Evidence | Likely owner |
| --- | --- | --- | --- | --- |
| High | The auth shell overflows horizontally below the tablet layout. At `320x568` and `390x844`, the hero content extends beyond the right edge and the auth form section is pushed off-screen. A user cannot see the sign-in controls or sign-up display-name form in the initial mobile viewport. | Open `/sign-in` or `/sign-up` at `320x568` or `390x844`. | `C:\tmp\mobile-responsive-baseline\sign-in-320x568.png`; `C:\tmp\mobile-responsive-baseline\sign-in-390x844.png`; `C:\tmp\mobile-responsive-baseline\sign-up-390x844.png` | Agent 6 auth, `components/auth/AuthShell.tsx` |
| High | Important auth-page text is clipped on narrow screens. The eyebrow, hero headline, and supporting paragraph run past the right edge instead of wrapping within the viewport. This prevents meaningful page content from being read on common mobile widths. | Open `/sign-in` or `/sign-up` at `320x568` or `390x844`. | `C:\tmp\mobile-responsive-baseline\sign-up-320x568.png`; `C:\tmp\mobile-responsive-baseline\sign-in-390x844.png` | Agent 6 auth, `components/auth/AuthShell.tsx` |
| High | Authenticated phone layouts have no route navigation. The desktop sidebar is hidden below `md`, and there is no mobile replacement for Dashboard, Entries, or Analytics. Users can switch metrics and add an entry but cannot move between primary routes. | Open any protected route at `320x568` or `390x844`. | `C:\tmp\mobile-responsive-baseline\protected-dashboard-metric-time-320x568.png`; `C:\tmp\mobile-responsive-baseline\protected-entries-metric-time-390x844.png`; `components/dashboard/Sidebar.tsx` | Agent 1 shell navigation |
| High | The authenticated topbar breaks at `768x1024`. The sidebar appears at `md`, but the topbar does not switch to its horizontal desktop layout until `lg`. Metric tabs collapse to approximately `24px` each and their labels overlap. | Open `/entries?metric=time` at `768x1024`. | `C:\tmp\mobile-responsive-baseline\protected-entries-metric-time-768x1024.png`; captured control geometry | Agent 2 topbar, `components/dashboard/Topbar.tsx` |
| Medium | The phone topbar remains usable but consumes roughly `292px` vertically before content begins. Because it is sticky, it obscures a large portion of the entry form and analytics content while scrolling. | Open `/entries?metric=time` at `390x844`, then scroll into filters and the form. | `C:\tmp\mobile-responsive-baseline\protected-scroll-entries-metric-time-390x844-700.png`; `C:\tmp\mobile-responsive-baseline\protected-scroll-analytics-metric-time-390x844-650.png` | Agent 2 topbar |
| Medium | Several authenticated topbar touch targets are below a practical `44px` mobile target: metric tabs are `36px` high, search and Add Entry are `40px` high, and the rendered Clerk user control is `28x28px`. | Open `/dashboard?metric=time` at `320x568`. | `C:\tmp\mobile-responsive-baseline\protected-dashboard-metric-time-320x568.png`; captured control geometry | Agent 2 topbar |
| Medium | The auth form is below the fold at `768x1024`, but the stacked tablet layout is readable and does not visibly clip. This is not necessarily a defect; retain it as a regression reference while changing the narrow-screen shell. | Open `/sign-in` and `/sign-up` at `768x1024`. | `C:\tmp\mobile-responsive-baseline\sign-in-768x1024.png`; `C:\tmp\mobile-responsive-baseline\sign-up-768x1024.png` | Agent 6 auth |

## Required Check Status

| Check | Status | Notes |
| --- | --- | --- |
| Page identity and meaningful content | Passed | Auth and protected pages rendered route-specific content. |
| Missing mobile navigation | Failed | Sidebar disappears below `md` with no phone replacement. |
| Horizontal page overflow | Failed on auth only | Protected matrix reported `scrollWidth === clientWidth` for all 36 captures. Auth pages overflow at `320x568` and `390x844`. |
| Clipped text or controls | Failed | Hero text clips; auth controls are pushed off-screen on narrow mobile sizes. |
| Overlapping elements | Failed at tablet | Metric labels overlap at `768x1024`. |
| Touch target sizing | Failed | Authenticated phone topbar includes multiple controls below `44px`. |
| Metric tab wrapping and usability | Failed at tablet | Tabs fit at phone widths but collapse and overlap at `768x1024`. |
| Entry form usability | Passed for empty-state form | Time and Calories form controls remain readable while scrolled at `390x844`. |
| Entry list action layout | Follow-up required | QA account has no entries, so Edit and Delete row layout was not exercised. |
| Chart container overflow and axis readability | Partial | Empty chart states fit on mobile. Populated axes remain unverified because the QA account has no entries. |
| Auth form layout | Failed on narrow mobile | Usable at `768x1024` and `1440x1000`; pushed off-screen at `320x568` and `390x844`. |
| Relevant console or runtime errors | Passed for authenticated capture | A console-health pass across dashboard, entries, and analytics captured no browser errors or warnings. |

## Desktop Regression Note

At `1440x1000`, both public auth routes render the expected two-column layout: hero panel on the left and form card on the right. Mobile changes should preserve this desktop composition.

Reference screenshots:

- `C:\tmp\mobile-responsive-baseline\sign-in-1440x1000.png`
- `C:\tmp\mobile-responsive-baseline\sign-up-1440x1000.png`

## Browser Sequence And Fallback

The required in-app Browser path was attempted first:

1. Loaded `scripts/browser-client.mjs`.
2. Called `setupBrowserRuntime({ globals: globalThis })`.
3. Intended to acquire `agent.browsers.get("iab")`.
4. Intended to name the session with `browser.nameSession("<audit session name>")`.
5. Intended to create a tab with `browser.tabs.new()`.

The Browser plugin failed repeatedly before tab acquisition with:

```text
windows sandbox failed: spawn setup refresh
```

No workspace Playwright dependency is installed, and the task prohibits adding dependencies. Public-route captures used installed headless Chrome with:

```text
chrome.exe --headless=new --window-size=<width>,<height> --virtual-time-budget=3500 --screenshot=<outside-repo-path> http://localhost:3000<route>
```

Protected-route captures used a temporary headless Chrome DevTools Protocol session and a short-lived Clerk sign-in token for the dummy development QA user. No password, session cookie, or Clerk secret was written to the repository or printed in chat.

## Handoff

- Report path: `planning/mobile-responsive-baseline-report.md`
- Required matrix captures: `44` public and redirected-route captures plus `36` authenticated protected-route captures
- Additional scrolled protected-route evidence: `8` screenshots
- Public routes verified visually: `/sign-in`, `/sign-up`
- Protected routes verified visually: `/dashboard`, `/entries`, `/analytics`
- Protected matrix geometry: no document-level horizontal overflow in `36` authenticated captures
- Browser console health: no errors or warnings captured during the authenticated dashboard, entries, and analytics pass
- Required follow-up: rerun populated entry-row action checks and populated chart axis checks after dummy entries are added to the QA account.
