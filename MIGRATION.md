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

## Troubleshooting `/api/entries` 500 errors

1. **Env file at repo root** — use `.env` or `.env.local` (not inside `client/`):

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/your_db?schema=public"
   ```

2. **Restart the dev server** after changing env vars (stop all `npm run dev` processes).

3. **Apply migrations** on the same database as `DATABASE_URL`:

   ```bash
   npx prisma migrate dev
   ```

4. **Verify DB access**:

   ```bash
   node scripts/test-db.mjs
   ```

   Expect `OK N entries`. If this works but the browser still returns 500, you are likely hitting an old server on another port — use the URL printed when you run `npm run dev`.

5. In development, 500 responses include the Prisma error message in `error.message` (check the Network tab).
