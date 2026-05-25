# DoothaHub Store

A modern, modular e-commerce platform built with Next.js 15, Prisma, Neon Postgres, Stripe, and Tailwind.

## Tech stack

- **Frontend / Backend**: Next.js 15 App Router (Server Components + Server Actions)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui primitives
- **DB**: Neon (serverless Postgres) + Prisma
- **Auth**: Auth.js v5 (Credentials + Google + GitHub, JWT sessions)
- **Payments**: Stripe (Payment Intents + webhook with idempotency)
- **Email**: Resend + React Email
- **Media**: Cloudinary (signed direct uploads)
- **Observability**: Sentry + PostHog
- **Tests**: Vitest (unit) + Playwright (E2E)
- **Hosting**: Vercel

## Project structure

```
src/
  app/                  # Next.js routes (store, auth, account, admin, api)
  modules/              # domain modules (catalog, cart, checkout, orders, ...)
  components/           # shared UI primitives + layout + seo
  lib/                  # cross-cutting singletons (db, stripe, env, ...)
  middleware.ts         # auth + RBAC gating
prisma/                 # schema, migrations, seed, raw SQL (FTS)
emails/                 # React Email templates
tests/{unit,e2e}/
.cursor/rules/          # AI coding rules
```

Each module under `src/modules/<name>/` follows the same layout:

```
<name>/
  index.ts              # ONLY public surface (others import from here)
  actions/              # "use server" mutations
  services/             # pure Prisma-facing logic
  queries.ts            # cached read helpers
  components/           # domain-scoped React components
  schemas/              # Zod schemas
  types.ts
```

The boundary is **enforced by ESLint** (`no-restricted-imports`): outside code can only reach a module through its `index.ts`. This is the single most important maintainability rule.

## Getting started

### 1. Prerequisites

- Node 20+
- pnpm 9+
- A [Neon](https://neon.tech) database (free tier works)
- [Stripe](https://stripe.com) test account
- (Optional) Cloudinary, Resend, Upstash, Sentry, PostHog accounts

### 2. Install & configure

```bash
pnpm install
cp .env.example .env
# fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET, STRIPE_* at minimum
```

Generate an `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Database

```bash
pnpm db:migrate     # applies migrations + generates client
pnpm db:fts         # applies the FTS (tsvector + GIN) raw migration
pnpm db:seed        # inserts demo data + admin user
```

Seeded admin user: `admin@doothahub.test` / `Admin123!`

### 4. Run

```bash
pnpm dev
```

Open <http://localhost:3000>.

### 5. Stripe webhook (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copy the printed `whsec_...` into STRIPE_WEBHOOK_SECRET
```

## Useful scripts

| Script               | What it does                          |
| -------------------- | ------------------------------------- |
| `pnpm dev`           | dev server                            |
| `pnpm build`         | prod build (runs `prisma generate`)   |
| `pnpm lint`          | ESLint                                |
| `pnpm typecheck`     | tsc --noEmit                          |
| `pnpm test`          | Vitest unit tests                     |
| `pnpm test:e2e`      | Playwright E2E (needs dev server)     |
| `pnpm db:migrate`    | run Prisma migrations in dev          |
| `pnpm db:deploy`     | run migrations in prod                |
| `pnpm db:studio`     | open Prisma Studio                    |
| `pnpm db:seed`       | seed demo data                        |
| `pnpm db:fts`        | apply the manual FTS migration        |

## Deployment

1. Push to GitHub.
2. Import to Vercel. Set all env vars from `.env.example`.
3. Add Stripe webhook endpoint pointing to `https://<your-domain>/api/webhooks/stripe`. Paste the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Run `pnpm db:deploy` once against the production `DIRECT_URL`.

## Architecture decisions

See `.cursor/rules/architecture.mdc` for the binding conventions. The TL;DR:

- One Next.js app, no monorepo. Modules give 95% of the maintainability with 10% of the overhead. Easy to extract later because each module has a single public surface.
- Server-first: every fetch is in a Server Component or Server Action. Client components only where needed.
- Prisma client is a singleton (`@/lib/db`). Services own all DB access; actions and routes go through services.
- `tenantId` is on every tenant-scoped model (nullable today) so future multi-tenancy needs no schema changes.
- Stripe webhooks are **idempotent** via the `StripeEvent` table — replays are safe.
