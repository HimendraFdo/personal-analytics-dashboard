---
name: verify
description: How to run and drive this app end-to-end with an authenticated user for verification.
---

# Verifying changes in the running app

## Build & launch

- `npm run dev` serves on http://localhost:3000 (or use `.claude/launch.json` → `next-dev`).
- Prisma CLI needs env vars loaded manually (prisma.config.ts skips .env):
  `set -a; . ./.env; set +a; npx prisma migrate status`

## Authenticated browser session (Clerk)

The built-in preview browser cannot reach localhost on this machine — use
headless Chrome with CDP instead:

1. Launch: `chrome.exe --headless=new --remote-debugging-port=9223 --user-data-dir=<temp-profile>`
2. Create a **throwaway QA user** via the Clerk Backend API (don't sign in as
   real accounts): `POST https://api.clerk.com/v1/users` with `CLERK_SECRET_KEY`.
3. Sign in via the repo script (creates a sign-in ticket and navigates Chrome):
   `QA_CLERK_USER_ID=<id> npx tsx scripts/qa-clerk-ticket-sign-in.ts`
   (defaults: CDP at :9223, app at :3000). Lands on /dashboard when successful.
4. Drive the page over CDP `Runtime.evaluate` (set React inputs via the native
   value setter + `dispatchEvent(new Event('input', {bubbles:true}))`;
   selects need a `change` event). `Page.captureScreenshot` for evidence.
5. Same-origin `fetch` from the signed-in page is the easiest way to probe API
   routes with cookies + Origin attached.

## Gotchas

- Unauthenticated API requests return **404** (Clerk `auth.protect()`), not 401.
- Tables use FORCE ROW LEVEL SECURITY: ad-hoc Prisma scripts silently affect 0
  rows unless run inside a transaction that first does
  `SELECT set_config('app.current_user_id', <userId>, true)`.
- Clean up afterwards: delete the QA user's Entry/Category rows (under RLS
  context) and `DELETE /v1/users/<id>` on Clerk.
