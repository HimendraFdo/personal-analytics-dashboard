# Personal Analytics Dashboard

Authenticated, mobile-responsive personal metrics tracker for logging time, spending, and nutrition, then reviewing those entries through dashboard summaries, filtered history, and analytics charts.

**Live demo:** [personalanalyticsdashboard.vercel.app](https://personalanalyticsdashboard.vercel.app)

[![CI](https://github.com/HimendraFdo/personal-analytics-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/HimendraFdo/personal-analytics-dashboard/actions/workflows/ci.yml)

---

## Preview

<img src="Images/Dashboard.png" width="700" alt="Authenticated dashboard summary with trends and recent entries"/>

<img src="Images/Entries.png" width="700" alt="Entries page with add, edit, filter, and sort controls"/>

<img src="Images/Analytics.png" width="700" alt="Analytics page with category totals and time-series charts"/>

<img src="Images/Authentication.png" width="700" alt="Clerk authentication page when you visit the site for the first time"/>

---

## What the app does

- Separates tracking into `Time`, `Money`, and `Calories` metric tabs with metric-specific labels, units, palettes, dashboards, entries, and analytics
- Tracks time across `Study`, `Finance`, `Health`, and `Personal` categories, spending in dollars, and nutrition in kilocalories
- Supports creating, editing, deleting, sorting, and filtering entries for the selected metric
- Supports manual calorie logging or authenticated food lookup through [Open Food Facts](https://world.openfoodfacts.org), including portion-based calories, protein, carbs, and fat
- Shows metric-specific summaries, 7-day totals, daily trends, recent entries, category or weekday breakdowns, and nutrition macro breakdowns
- Uses a responsive desktop sidebar, mobile bottom navigation, compact topbar, and mobile-friendly cards and charts
- Protects dashboard, entries, analytics, and API routes with Clerk authentication and scopes every entry to its signed-in owner
- Applies PostgreSQL row level security (RLS), same-origin mutation checks, JSON body limits, API rate limiting, upstream food-search timeouts, and HTTP security headers

---

## Tech stack

| Layer | Tools |
|-------|-------|
| App | Next.js 15 App Router, React 19, TypeScript |
| Auth | Clerk |
| Styling | Tailwind CSS 4 |
| Data | Prisma ORM, PostgreSQL |
| Charts | Recharts |
| Validation | Zod |
| Testing | Vitest |
| Rate limiting | Upstash Redis REST API in production, in-memory fallback in development |
| Food data | [Open Food Facts](https://world.openfoodfacts.org) |
| Hosting | Vercel |
| Database (production) | [Neon](https://neon.tech) serverless Postgres |

---

## Architecture

```mermaid
flowchart LR
  User["Signed-in user"]
  Clerk["Clerk auth"]
  UI["Next.js App Router UI"]
  API["Protected /api/entries routes"]
  FoodAPI["Authenticated /api/food/search route"]
  Prisma["Prisma Client"]
  DB[(PostgreSQL)]
  Redis["Upstash Redis rate limits"]
  OFF["Open Food Facts"]

  User --> Clerk
  Clerk --> UI
  UI --> API
  UI --> FoodAPI
  API --> Prisma
  Prisma --> DB
  API --> Redis
  FoodAPI --> Redis
  FoodAPI --> OFF
```

Routes:

| Route | Purpose |
|-------|---------|
| `/` | Redirects to `/dashboard` |
| `/sign-in` | Clerk sign-in page |
| `/sign-up` | Clerk sign-up page |
| `/dashboard` | Overview, trend chart, recent entries, and progress summary |
| `/entries` | Entry form, edit/delete actions, filtering, sorting, and history |
| `/analytics` | Derived totals, latest entry, category chart, and value-over-time chart |
| `/api/entries` | Authenticated `GET` and `POST` handlers with metric filtering |
| `/api/entries/[id]` | Authenticated `PATCH` and `DELETE` handlers |
| `/api/food/search` | Authenticated, rate-limited Open Food Facts lookup |

The API uses Clerk's `userId` to scope reads and writes. Prisma persists entries with ownership, metric type, category, date, value, title, note, timestamps, and optional calorie-specific nutrition details.

---

## Quick start (local)

```bash
git clone https://github.com/HimendraFdo/personal-analytics-dashboard.git
cd personal-analytics-dashboard
npm install
```

Create `.env.local` from `.env.example`, then replace the placeholders with values from Neon and Clerk:

```bash
DATABASE_URL="postgresql://APP_USER:PASSWORD@HOST-pooler/DATABASE?sslmode=require"
DIRECT_DATABASE_URL="postgresql://MIGRATION_USER:PASSWORD@HOST/DATABASE?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_or_pk_live_placeholder"
CLERK_SECRET_KEY="sk_test_or_sk_live_placeholder"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/dashboard"
# Optional: disables Clerk telemetry explicitly in every environment.
# The app already disables Clerk telemetry automatically outside production.
NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED="true"
APP_ORIGIN="http://localhost:3000"
```

For local development, remove the placeholder `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` lines unless you configure a real Upstash database. The app then uses its in-memory development rate-limit store.

Then prepare the database and start the app:

```bash
npx prisma migrate dev
npm run db:seed   # optional sample data
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string, usually Neon in production |
| `DIRECT_DATABASE_URL` | Yes for migrations and deployment builds | Migration/admin PostgreSQL connection string, preferably a direct Neon URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Public Clerk browser key |
| `CLERK_SECRET_KEY` | Yes | Server-side Clerk key used by protected routes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Recommended | Points Clerk to the local `/sign-in` route |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Recommended | Points Clerk to the local `/sign-up` route |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | Recommended | Sends users to `/dashboard` after sign in |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | Recommended | Sends users to `/dashboard` after sign up |
| `NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED` | Optional | Set to `true` to disable Clerk telemetry explicitly; local development disables it by default to avoid CSP telemetry warnings |
| `CLERK_FRONTEND_API_URL` | Optional | Exact Clerk Frontend API URL for Content Security Policy configuration when it cannot be derived from the publishable key |
| `APP_ORIGIN` | Recommended | Canonical application origin allowed to make entry mutations |
| `APP_ALLOWED_ORIGINS` | Optional | Comma-separated additional allowed origins, such as trusted preview deployments |
| `UPSTASH_REDIS_REST_URL` | Required in production | Upstash Redis REST endpoint used for distributed API rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Required in production | Upstash Redis REST token used for distributed API rate limiting |

### Database roles and RLS

`Entry` rows are protected by PostgreSQL row level security in addition to the API's Clerk `userId` filters. Production should use separate database roles:

- `DATABASE_URL`: runtime app role. It must not own the `Entry` table and must not have `BYPASSRLS`.
- `DIRECT_DATABASE_URL`: migration/admin role. Use this for Prisma migrations and schema changes.

The runtime role needs only the privileges required to read and mutate app tables. On Neon, the runtime URL may use the pooled `-pooler` host. RLS user context is set with `set_config(..., true)` inside the same Prisma transaction as protected `Entry` queries, so it is safe with PgBouncer transaction pooling.

### Request security and rate limiting

Entry mutations reject cross-origin requests, require JSON for create and update operations, and enforce a 16 KB body limit. Responses include a Content Security Policy and common browser hardening headers; production also adds HSTS.

Rate limiting uses Upstash Redis in production. Development falls back to an in-memory store when Upstash settings are not present. The food-search endpoint applies both per-user and per-IP limits before calling Open Food Facts with a 5-second timeout.

---

## Docker

Copy the Docker example env file and fill in at least the Clerk keys:

```bash
cp .env.docker.example .env.docker
```

Build the production image and start the app with the local PostgreSQL service:

```bash
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d db
docker compose --env-file .env.docker run --rm migrate
docker compose --env-file .env.docker up app
```

Open [http://localhost:3001](http://localhost:3001).

The compose file defaults `DATABASE_URL` and `DIRECT_DATABASE_URL` to the bundled local Postgres container. To use Neon or another external database instead, set those variables in `.env.docker` before running the commands above. Public Clerk values are passed as Docker build args because Next.js embeds `NEXT_PUBLIC_*` variables in the browser bundle at build time. Rebuild the image after changing them.

The app image does not run migrations automatically; run `docker compose run --rm migrate` after schema changes or before the first containerized start.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Generate Prisma Client and create a production build |
| `npm run vercel-build` | Generate Prisma Client, deploy migrations, and build for Vercel |
| `npm run start` | Start the production server |
| `npm run lint` | Run the configured Next.js lint command |
| `npm run typecheck` | Run TypeScript without emitting compiled files |
| `npm run test` | Run Vitest tests |
| `npm run test:integration` | Run PostgreSQL RLS integration tests against `RLS_TEST_DATABASE_URL` |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run db:migrate` | Create and apply local Prisma migrations |
| `npm run db:seed` | Seed sample entries |
| `npm run db:push` | Push Prisma schema changes without creating a migration |

---

## Production deploy (Vercel + Neon + Clerk + Upstash)

1. Create a [Neon](https://neon.tech) project. Provision a least-privilege runtime role for `DATABASE_URL` and a migration/admin role for `DIRECT_DATABASE_URL`.
2. Create a Clerk application and copy the publishable and secret keys.
3. Create an [Upstash Redis](https://upstash.com) database and copy its REST URL and token.
4. Import the repo in [Vercel](https://vercel.com).
5. Set the database, Clerk, Upstash, and application-origin variables in Vercel Environment Variables.
6. Deploy. Vercel runs `npm run vercel-build`, which runs `prisma migrate deploy` before `next build`.
7. Visit `/sign-up`, create an account, add entries under each metric tab, and confirm they appear on `/dashboard`, `/entries`, and `/analytics`.

See [MIGRATION.md](./MIGRATION.md) for API details and troubleshooting.

---

## Testing

The default test suite covers date helpers, metric formatting, nutrition calculations, entry serialization, validation, food-search input hardening, request-origin checks, rate limiting, security headers, API ownership checks, and credential hygiene.

```bash
npm run test
```

The PostgreSQL RLS suite is opt-in because it requires a migrated disposable
database and a least-privilege runtime role that does not own `Entry` and does
not have `BYPASSRLS`. Set `RLS_TEST_DATABASE_URL` to that runtime role URL,
then run:

```bash
npm run test:integration
```

---

## CI/CD

GitHub Actions runs the CI quality gate on pull requests, pushes to `main`, and manual dispatches:

```bash
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm run test
npm run build
```

Production deployment is handled by `.github/workflows/deploy.yml` after the `main` branch CI workflow succeeds, or by manual dispatch. It uses the Vercel CLI prebuilt-artifact flow: pull the production Vercel environment, build with `vercel build --prod`, then deploy with `vercel deploy --prebuilt --prod`.

Add these repository secrets in GitHub before enabling the deployment workflow:

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel token used by GitHub Actions |
| `VERCEL_ORG_ID` | Vercel team or account ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

The production application variables such as `DATABASE_URL`, `DIRECT_DATABASE_URL`, Clerk keys, Upstash settings, and `APP_ORIGIN` should stay in Vercel Environment Variables. The deployment workflow pulls them from Vercel during the build step.

---

## What I learned

- Migrating a Vite-style dashboard into the Next.js App Router while keeping shared UI state predictable
- Adding Clerk authentication around app routes and API routes
- Scoping database records by authenticated `userId`
- Modeling multi-metric and nutrition entries with Prisma migrations, indexes, and typed API responses
- Validating create and update payloads with Zod before database writes
- Centralising fetch and mutation logic so dashboard, entries, and analytics stay in sync
- Applying defense in depth with API ownership filters, PostgreSQL RLS, rate limits, origin checks, and browser security headers
- Deploying Prisma migrations safely through the Vercel build flow with separate runtime and migration database roles
- Scaling a desktop dashboard down to mobile navigation, compact controls, and responsive charts

---

## Future work

- Export entries as CSV or JSON
- Add date-range controls to analytics charts
- Add goal configuration instead of fixed progress assumptions
- Add richer onboarding and empty states for first-time users
- Add configurable currency and locale preferences
- Add a production monitoring dashboard for rate-limit and upstream food-search failures

---

## Project structure

```text
app/             Next.js routes, layouts, auth pages, and API handlers
components/      Dashboard, entries, analytics, layout, auth, navigation, and status UI
contexts/        Shared entries provider
hooks/           Client-side entry loading and mutation hooks
layouts/         Shell layout wrapper
lib/             Prisma, API, analytics, nutrition, rate-limit, and security helpers
prisma/          Schema, migrations, and seed data
integration/     Opt-in PostgreSQL RLS integration suite
types/           Shared TypeScript entry types
utils/           Date formatting and parsing helpers
Images/          README screenshots
planning/        Planning notes and roadmap documents
personal-analytics-course/  Interactive codebase learning walkthrough
```

Interview walkthrough: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
