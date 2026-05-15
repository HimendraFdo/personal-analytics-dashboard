# Coordinator Decisions — Personal Analytics Dashboard

**Date:** 2026-05-16  
**Locked backend path:** Next.js App Router + API route handlers + Prisma + PostgreSQL  
**Current state:** React 19 + Vite + Tailwind 4 + Recharts in `client/`; entries in `localStorage`; stub nav for Reports, Goals, Settings, Help; Dashboard “Main Chart Placeholder”.

This document is the single source of truth for the Full-stack, Ship (UX/nav), and Polish agents. Do not change the backend path or re-litigate nav scope without a new coordinator pass.

---

## 1. Target repo structure

After migration, the app lives at the **repository root** (not under `client/`). Vite-specific files are removed once the Next app is verified.

```
personal-analytics-dashboard/
├── app/
│   ├── layout.tsx                 # root layout, fonts, global styles
│   ├── globals.css                # Tailwind 4 entry (from client/src/index.css)
│   ├── page.tsx                   # redirect → /dashboard
│   ├── dashboard/
│   │   └── page.tsx               # DashboardSection + layout shell
│   ├── entries/
│   │   └── page.tsx               # EntriesSection (form + list)
│   ├── analytics/
│   │   └── page.tsx               # AnalyticsSection (Recharts)
│   └── api/
│       └── entries/
│           ├── route.ts           # GET list, POST create
│           └── [id]/
│               └── route.ts       # PATCH update, DELETE
├── components/
│   └── dashboard/                 # migrated from client/src/components/dashboard/
├── layouts/
│   └── DashboardLayout.tsx        # Sidebar + Topbar + main slot
├── lib/
│   ├── prisma.ts                  # PrismaClient singleton
│   ├── api.ts                     # fetch wrappers for /api/entries
│   └── errors.ts                  # map API errors → UI messages
├── types/
│   └── entry.ts                   # Entry, EntryCategory (shared)
├── utils/
│   └── date.ts                    # formatDateForInput, parse API dates
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                    # optional; mirrors INITIAL_ENTRIES
├── public/                        # icons, static assets
├── planning/                      # unchanged
├── .env.example
├── .env.local                     # gitignored
├── next.config.ts
├── package.json                   # single app package (replaces client/package.json)
├── tsconfig.json
├── postcss.config.mjs             # if required by Tailwind 4 + Next
├── eslint.config.js
└── README.md
```

**What happens to `client/`:** **Delete after migration** (not archive). Rationale: one deployable app, one `package.json`, and README structure already needs correction; keeping `client/` invites drift. **Procedure:** Full-stack agent copies/moves assets and components into the root layout above; once `npm run build` and manual smoke test pass on `feat/next-fullstack`, remove the entire `client/` directory in the same PR (or a follow-up commit on that branch before merge). Do not delete `client/` until the Next app reproduces Dashboard, Entries, and Analytics behavior.

**Preserved paths:** `planning/`, screenshot assets under `public/` or `docs/` (move from `client/src/assets/` if referenced in README).

---

## 2. API contract (REST via Next.js route handlers)

Base URL in development: `http://localhost:3000`. All bodies are `application/json`. Dates on the wire are **ISO 8601 strings** (UTC or date-only `YYYY-MM-DD` accepted on input; responses use full ISO timestamps).

### Types (aligned with `Entry`)

| Field      | Type     | Notes                                      |
|-----------|----------|--------------------------------------------|
| `id`      | string   | UUID v4, server-generated on POST          |
| `title`   | string   | required, 1–200 chars                      |
| `value`   | number   | required, finite                           |
| `category`| enum     | `Study` \| `Finance` \| `Health` \| `Personal` |
| `date`    | string   | ISO 8601 in JSON                           |
| `note`    | string   | optional, default `""`, max 2000 chars     |

### `GET /api/entries`

**Query (optional):** `category`, `sort` (`date_desc` default | `date_asc` | `value_desc` | `value_asc`).

**200 response:**

```json
{
  "entries": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Study Hours",
      "value": 2.5,
      "category": "Study",
      "date": "2026-03-31T00:00:00.000Z",
      "note": "Worked on frontend layout"
    }
  ]
}
```

### `POST /api/entries`

**Request body** (no `id`):

```json
{
  "title": "Workout",
  "value": 45,
  "category": "Health",
  "date": "2026-03-29",
  "note": "Evening gym session"
}
```

**201 response:** single entry object (with `id`).

### `PATCH /api/entries/[id]`

**Request body:** partial fields; at least one of `title`, `value`, `category`, `date`, `note`.

```json
{
  "value": 50,
  "note": "Extended session"
}
```

**200 response:** updated entry object.

### `DELETE /api/entries/[id]`

**204 response:** empty body.

### Error shape (all non-2xx)

```json
{
  "error": {
    "message": "Human-readable description",
    "code": "VALIDATION_ERROR"
  }
}
```

| Status | `code` examples              | When                          |
|--------|------------------------------|-------------------------------|
| 400    | `VALIDATION_ERROR`           | invalid body, bad category    |
| 404    | `NOT_FOUND`                  | unknown `id`                  |
| 405    | `METHOD_NOT_ALLOWED`         | wrong HTTP method             |
| 500    | `INTERNAL_ERROR`             | unhandled server/DB errors    |

Route handlers must not leak stack traces in production responses.

---

## 3. Prisma schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum EntryCategory {
  Study
  Finance
  Health
  Personal
}

model Entry {
  id        String        @id @default(uuid()) @db.Uuid
  title     String
  value     Float
  category  EntryCategory
  date      DateTime
  note      String        @default("")
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@index([date(sort: Desc)])
  @@index([category])
}
```

**Mapping notes:** Prisma `EntryCategory` matches TS `EntryCategory` literals. Client code parses `date` from API strings to `Date` using `utils/date.ts`. `createdAt` / `updatedAt` are server-only unless exposed later.

---

## 4. Nav strategy

**Decision:** **Remove Reports, Goals, Settings, and Help from main and workspace nav until v2.** Only **Dashboard**, **Entries**, and **Analytics** remain. Stub sections add noise and imply features outside MVP (`planning/mvp.md`). Ship agent trims nav on the current Vite tree first (`feat/ux-nav`); Full-stack agent applies the same three-item nav when porting `Sidebar` and routing.

**Files to change (Vite / pre-migration — Ship owns on `feat/ux-nav`):**

| File | Change |
|------|--------|
| `client/src/constants/navigation.ts` | `MAIN_NAV_ITEMS` = Dashboard, Entries, Analytics only; remove `WORKSPACE_NAV_ITEMS` or leave empty and stop exporting for Sidebar |
| `client/src/components/dashboard/Sidebar.tsx` | Remove Workspace block or hide when `WORKSPACE_NAV_ITEMS` is empty |
| `client/src/pages/DashboardPage.tsx` | Remove imports and branches for Reports, Goals, Settings, Help |
| `client/src/components/dashboard/ReportsSection.tsx` | Delete or keep file unreferenced (prefer delete to avoid dead code) |
| `client/src/components/dashboard/GoalsSection.tsx` | Same |
| `client/src/components/dashboard/SettingsSection.tsx` | Same |
| `client/src/components/dashboard/HelpSection.tsx` | Same |
| `client/src/components/dashboard/EmptySection.tsx` | Keep only if still needed for fallback; otherwise delete |

**Post-migration equivalents (Full-stack owns on `feat/next-fullstack`):** `constants/navigation.ts`, `components/dashboard/Sidebar.tsx`, and per-route pages under `app/` — no section switcher in a monolithic page; URL is source of truth (`/dashboard`, `/entries`, `/analytics`).

---

## 5. Migration plan (Full-stack agent, max 15 steps)

1. Create branch `feat/next-fullstack` from latest `main` (after Ship nav PR merged if possible).
2. Scaffold Next.js 15 App Router + TypeScript at repo root (`create-next-app` in temp dir or manual merge); add Tailwind 4 + Recharts dependencies matching current versions where compatible.
3. Copy `types/entry.ts`, `utils/date.ts`, and `components/dashboard/*` (except deleted stub sections) into root `types/`, `utils/`, `components/dashboard/`.
4. Move global styles from `client/src/index.css` → `app/globals.css`; wire `app/layout.tsx`.
5. Replace Vite routing with App Router: `app/dashboard/page.tsx`, `app/entries/page.tsx`, `app/analytics/page.tsx`; shared `DashboardLayout`.
6. Add `lib/prisma.ts` and `prisma/schema.prisma`; run `prisma migrate dev` locally.
7. Implement `GET`/`POST` in `app/api/entries/route.ts` with Zod (or equivalent) validation.
8. Implement `PATCH`/`DELETE` in `app/api/entries/[id]/route.ts`.
9. Add `lib/api.ts` client helpers; replace `localStorage` in page-level data hooks with `fetch` + `useEffect` or SWR/React Query (minimal: `useState` + `useEffect` is fine for portfolio).
10. Wire Entries page: add/update/delete call API; remove `STORAGE_KEY` and `getStoredEntries` from migrated code.
11. Verify Analytics charts still receive `Entry[]` with parsed dates.
12. Add `prisma/seed.ts` + `package.json` script `db:seed` for demo data.
13. Add root `.env.example`; document `DATABASE_URL` in README (Polish may expand).
14. Run `npm run build`; smoke test all three routes and CRUD.
15. Delete `client/` directory and root references to Vite; update `package.json` scripts to `next dev`, `next build`, `prisma migrate`.

---

## 6. File ownership (parallel safety)

| Path / concern | Owner branch | Agent | May touch | Must not touch |
|----------------|--------------|-------|-----------|----------------|
| `planning/coordinator-decisions.md` | `docs/coordinator-decisions` | Coordinator | ✓ | — |
| `planning/*.md` (other) | any | Coordinator / Polish | read; Polish may fix typos | Full-stack rewrites |
| `client/src/constants/navigation.ts`, `Sidebar.tsx`, `DashboardPage.tsx`, stub sections | `feat/ux-nav` | Ship | ✓ | `prisma/`, `app/api/`, Next config, deploy |
| `app/**`, `lib/**`, `prisma/**`, root `package.json`, `next.config.*` | `feat/next-fullstack` | Full-stack | ✓ | Nav files if Ship PR open—rebase Ship first |
| `README.md`, `.github/`, tests, `.env.example` polish | `chore/polish` | Polish | ✓ | Prisma schema changes, API contract changes |
| `client/` delete | `feat/next-fullstack` | Full-stack | ✓ (final step) | Ship after client removed |

**Merge order:** `feat/ux-nav` → `main` → `feat/next-fullstack` → `main` → `chore/polish` → `main`.

---

## 7. Branch names

| Branch | Purpose |
|--------|---------|
| `docs/coordinator-decisions` | This document |
| `feat/ux-nav` | Ship: trim nav, sidebar cleanup, optional Topbar polish |
| `feat/next-fullstack` | Next.js + Prisma + API + migrate components + remove `client/` |
| `chore/polish` | README truthfulness, scripts, optional CI/tests, screenshots |

---

## 8. Environment variables

**`.env.example` keys only (no secrets committed):**

```env
# PostgreSQL connection string (local Docker, Neon, Supabase, etc.)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"

# Optional: direct URL for Prisma migrate (Neon/Supabase pooler setups)
# DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

**Vercel / production (set in dashboard, not in repo):**

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | yes | Pooled connection URL on Vercel |
| `DIRECT_URL` | if host uses pooling | Prisma migrations |
| `NODE_ENV` | automatic | — |

No `NEXT_PUBLIC_*` vars required for MVP (same-origin API routes).

---

## 9. Handoff checklist

### Ship agent (`feat/ux-nav`)

**Does:**

- Reduce nav to Dashboard, Entries, Analytics.
- Update `Sidebar` (single nav group).
- Remove dead section components and `DashboardPage` branches.
- Optional: Topbar “Add Entry” links to Entries or scroll (no new features).

**Must NOT:**

- Initialize Next.js, Prisma, or PostgreSQL.
- Add API routes or change data persistence (leave `localStorage` as-is).
- Deploy to Vercel or configure production env.
- Delete `client/` or restructure repo root.

### Full-stack agent (`feat/next-fullstack`)

**Must deliver before Polish:**

- Working Next app with three pages and shared layout.
- Prisma schema migrated; CRUD via `/api/entries`.
- No `localStorage` for entries in production path.
- `client/` removed; `npm run build` passes.
- `.env.example` present.

**Must NOT:**

- Re-add Reports/Goals/Settings/Help nav without coordinator approval.
- Change `Entry` field names or categories without updating this doc.

### Polish agent (`chore/polish`)

**Does:**

- Fix README: real stack (Next, Prisma, Postgres), setup (`npm install`, `prisma migrate`, `npm run dev`), honest project structure.
- Optional: GitHub Actions (`lint`, `build`), minimal API or component test.
- Screenshot paths after asset move.

**Must NOT:**

- Change API contract or Prisma models without coordinator sign-off.
- Deploy unless user explicitly requests.

### Definition of done (whole portfolio)

- [ ] User can create, read, update, delete entries persisted in PostgreSQL.
- [ ] Dashboard, Entries, and Analytics routes work in production build.
- [ ] Nav shows only three items; no stub sections in UI.
- [ ] README matches repo; clone-to-run steps documented.
- [ ] No misleading “full-stack” claims without a running API + DB.
- [ ] (Stretch) CI green on PR; seed script for demo data.

---

## Appendix: current facts (for agents)

- **Entry type:** `client/src/types/entry.ts` — `id`, `title`, `value`, `category`, `date`, `note`.
- **Categories:** Study | Finance | Health | Personal.
- **State:** `DashboardPage.tsx` owns entries + `localStorage` key `personal-analytics-dashboard-entries`.
- **Charts:** `AnalyticsSection.tsx` uses Recharts; keep dependency in root `package.json`.
- **Placeholder:** Dashboard “Main Chart Placeholder” is out of MVP; Polish or v2 may replace with Recharts trend from existing data.
- **README gap:** claims full-stack; only `client/` exists today — Polish fixes after Full-stack lands.
