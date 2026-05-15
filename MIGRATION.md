# Next.js migration (Path C)

The Vite app under `client/` is deprecated. Run the app from the repository root.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and set PostgreSQL URL:

```bash
cp .env.example .env.local
```

3. Apply database migrations and optional seed:

```bash
npx prisma migrate dev
npm run db:seed
```

4. Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — routes: `/dashboard`, `/entries`, `/analytics`.

## Production build

```bash
npm run build
npm run start
```

## Production deploy (Vercel + Neon)

1. Create a Neon project; use the pooled connection string as `DATABASE_URL` and the direct URL as `DIRECT_URL` when Neon provides both.
2. In Vercel project settings, add those environment variables for Production.
3. Deploy from `main` or a preview branch — `npm run build` runs `prisma migrate deploy` automatically.
4. Smoke-test: open `/dashboard`, add an entry on `/entries`, confirm it appears on `/analytics`.

## Prisma commands

| Command | Purpose |
|---------|---------|
| `npm run db:migrate` | Create/apply migrations locally |
| `npm run db:seed` | Insert sample entries (skips if data exists) |
| `npm run db:push` | Push schema without migration files (prototyping) |

## API

- `GET /api/entries` — list (optional `category`, `sort`)
- `POST /api/entries` — create
- `PATCH /api/entries/[id]` — update
- `DELETE /api/entries/[id]` — delete

Entries persist in PostgreSQL; `localStorage` is no longer used.
