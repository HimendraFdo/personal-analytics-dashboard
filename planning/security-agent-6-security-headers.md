# Security Agent 6: Security Headers And Browser Hardening

## Objective

Add secure browser/platform headers to reduce XSS impact, clickjacking, MIME sniffing, referrer leakage, unnecessary browser permissions, and insecure transport risks.

This task should run after:

- Credential hygiene
- SQL injection and query safety audit
- Ownership enforcement and safer data access
- API rate limiting
- CSRF, origin, and request hardening
- Food search abuse protection

## Context

This project is a Next.js app using:

- App Router
- Clerk authentication
- Open Food Facts API access from a server route

Relevant pages/routes include:

- `/sign-in`
- `/sign-up`
- `/dashboard`
- `/entries`
- `/analytics`
- `/api/entries`
- `/api/food/search`

Security headers must not break Clerk sign-in/sign-up or Next.js development behavior.

## Files To Inspect

- `next.config.ts`
- `middleware.ts`
- `app/layout.tsx`
- `app/sign-in/[[...sign-in]]/page.tsx`
- `app/sign-up/[[...sign-up]]/page.tsx`
- `components/auth/**/*`
- `.env.example`
- tests or documented manual verification

## Required Work

### 1. Add A Security Headers Configuration

Add headers through `next.config.ts` using Next.js `headers()`, unless there is a strong project reason to use middleware.

Include:

```text
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
X-Frame-Options: DENY
Content-Security-Policy: ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

If using CSP `frame-ancestors 'none'`, `X-Frame-Options: DENY` is still acceptable as a legacy fallback.

Only set HSTS in production HTTPS contexts. Do not force HSTS in local development.

### 2. Create A CSP Compatible With The App

Start with a restrictive CSP and allow only what is needed.

Baseline directives:

```text
default-src 'self'
base-uri 'self'
object-src 'none'
frame-ancestors 'none'
img-src 'self' data: blob: https:
font-src 'self' data:
style-src 'self' 'unsafe-inline'
script-src 'self' ...
connect-src 'self' ...
form-action 'self'
upgrade-insecure-requests
```

Important:

- Clerk may require specific script, frame, image, and connect domains.
- Next.js development may require looser settings than production.
- Avoid broad `*` where a narrower host allow-list works.

Document any intentionally broad directive.

### 3. Support Clerk Auth Pages

Manually verify or test:

- `/sign-in`
- `/sign-up`
- signing in
- signing up
- redirecting to `/dashboard`

If Clerk requires external domains, add only the required Clerk domains.

Examples to investigate, depending on the Clerk setup:

```text
https://*.clerk.accounts.dev
https://*.clerk.dev
https://clerk.* 
```

Do not blindly copy these. Confirm what the app actually uses.

### 4. Keep API Routes Working

Verify:

- `GET /api/entries`
- `POST /api/entries`
- `GET /api/food/search`

CSP mainly affects browser behavior, but headers should not change JSON response behavior or CORS assumptions.

### 5. Add Environment Awareness

If the CSP differs between development and production, make that explicit in code.

Examples:

- allow `unsafe-eval` only in development if required by Next.js
- allow localhost websocket/connect sources only in development
- add `upgrade-insecure-requests` only in production

Do not accidentally make production CSP as loose as development CSP.

### 6. Add Tests Or Header Verification

Add automated checks where practical:

- unit test exported header builder function, or
- integration test a known route's response headers

At minimum, document manual verification steps and results.

Check that these headers exist on page routes:

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-Frame-Options` or CSP `frame-ancestors`

For production only:

- `Strict-Transport-Security`

### 7. Run Verification

Run:

```bash
npm test
npm run lint
npm run build
```

Then start the app and check auth pages if possible:

```bash
npm run dev
```

Use browser devtools console/network checks to confirm there are no CSP violations during normal app load and auth flows.

## Out Of Scope

Do not implement rate limiting.

Do not implement RLS.

Do not rotate credentials.

Do not change API ownership checks.

Do not add CSRF/origin request validation.

Do not weaken auth to make CSP easier.

## Acceptance Criteria

The task is complete when:

- Security headers are applied to app routes.
- CSP is present and does not use broad wildcards unless justified.
- Clerk sign-in/sign-up still work.
- Dashboard pages still load.
- API routes still return expected JSON responses.
- Development-only CSP allowances are not applied to production unless explicitly justified.
- HSTS is production-only.
- Tests or documented manual checks confirm headers are present.
- `npm test`, `npm run lint`, and `npm run build` pass, or exact blockers are documented.

## Final Report Format

Return a short report with:

```text
Summary:
- ...

Changed files:
- ...

Header checks:
- Content-Security-Policy: pass/fail
- X-Content-Type-Options: pass/fail
- Referrer-Policy: pass/fail
- Permissions-Policy: pass/fail
- X-Frame-Options or frame-ancestors: pass/fail
- HSTS production-only: pass/fail

Compatibility checks:
- Clerk sign-in: pass/fail/not checked
- Clerk sign-up: pass/fail/not checked
- Dashboard load: pass/fail/not checked
- API JSON responses: pass/fail/not checked

Verification:
- npm test: pass/fail/not run
- npm run lint: pass/fail/not run
- npm run build: pass/fail/not run

Remaining risks or blockers:
- ...
```
