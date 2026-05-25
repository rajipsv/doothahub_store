# DoothaHub Store

A modern, modular e-commerce platform built with Next.js 15, Prisma, Neon Postgres, **Razorpay**, and Tailwind. India-first (INR, UPI, NetBanking, cards, wallets), production-ready, multi-tenant capable.

## Tech stack

- **Frontend / Backend**: Next.js 15 App Router (Server Components + Server Actions)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui primitives
- **DB**: Neon (serverless Postgres) + Prisma
- **Auth**: Auth.js v5 (Credentials + Google + GitHub, JWT sessions)
- **Payments**: **Razorpay** (Orders API + Checkout JS + signed webhook, idempotent)
- **Email**: Resend + React Email
- **Media**: Cloudinary (signed direct uploads)
- **Observability**: Sentry + PostHog
- **Tests**: Vitest (unit) + Playwright (E2E)
- **Hosting**: Vercel

## Why Razorpay?

For an India-based storefront Razorpay is the better default:

- **Free to start** — no setup fee, no monthly fee, no contract. You only pay per-transaction.
- Native **UPI**, NetBanking, all Indian wallets, Indian cards out of the box (UPI is ~50%+ of Indian online checkouts; Stripe India is invite-only and UPI is friction-heavy there).
- **Test mode** keys work instantly with no KYC — perfect for development and CI.
- Familiar checkout UI for Indian shoppers → higher conversion.

## Project structure

```
src/
  app/                  # Next.js routes (store, auth, account, admin, api)
  modules/              # domain modules (catalog, cart, checkout, orders, payments, ...)
  components/           # shared UI primitives + layout + seo
  lib/                  # cross-cutting singletons (db, razorpay, env, ...)
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

The boundary is **enforced by ESLint** (`no-restricted-imports`): outside code can only reach a module through its `index.ts`.

## Getting started

### 1. Prerequisites

- Node 20+
- pnpm 9+
- A [Neon](https://neon.tech) database (free tier works)
- A [Razorpay](https://razorpay.com) account — **test mode keys are free and work without KYC**. Production needs business KYC (PAN, address proof, bank account).
- (Optional) Cloudinary, Resend, Upstash, Sentry, PostHog accounts

### 2. Install & configure

```bash
pnpm install
cp .env.example .env
```

Generate an `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### Minimum env vars by goal

The env validator is intentionally permissive so you can deploy in stages:

| Goal | Required env vars |
| --- | --- |
| **Just deploy the storefront** (browse + cart) | `DATABASE_URL` |
| Also enable sign-in / sign-up | `+ AUTH_SECRET` (32+ chars) |
| Also enable checkout / orders | `+ RAZORPAY_KEY_ID` `+ RAZORPAY_KEY_SECRET` `+ NEXT_PUBLIC_RAZORPAY_KEY_ID` `+ RAZORPAY_WEBHOOK_SECRET` |
| Also enable Google / GitHub OAuth | `+ AUTH_GOOGLE_ID` / `_SECRET`, `AUTH_GITHUB_ID` / `_SECRET` |
| Also enable order-confirmation emails | `+ RESEND_API_KEY` `+ RESEND_FROM_EMAIL` |
| Also enable product image uploads (admin) | `+ CLOUDINARY_CLOUD_NAME` `+ CLOUDINARY_API_KEY` `+ CLOUDINARY_API_SECRET` `+ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |
| Also enable rate limiting | `+ UPSTASH_REDIS_REST_URL` `+ UPSTASH_REDIS_REST_TOKEN` |
| Also enable error tracking | `+ SENTRY_DSN` (+ `NEXT_PUBLIC_SENTRY_DSN`) |
| Production-only niceties | `NEXT_PUBLIC_APP_URL` (auto-derived from `VERCEL_URL` if absent) |

`DIRECT_URL` falls back to `DATABASE_URL` automatically, so you can paste a single Neon URL and skip the separate "direct" connection if you're not running migrations from production.

When optional credentials are missing:

- **Razorpay missing** → checkout page renders but the "Pay" button returns `Payments are not configured...`.
- **AUTH_SECRET missing** → sign-in / sign-up routes 500; browsing & cart still work fully.
- **Resend missing** → order confirmation email is silently skipped.
- **Cloudinary missing** → admin product-image upload UI shows an error; products without images still work.

### 3. Razorpay keys

1. Sign up at <https://dashboard.razorpay.com/signup>.
2. Stay in **Test Mode** (toggle in the top-left).
3. Go to **Settings → API Keys → Generate Test Key**. You'll get a `key_id` (starts with `rzp_test_`) and `key_secret`.
4. Put them in `.env`:
   ```env
   RAZORPAY_KEY_ID="rzp_test_..."
   RAZORPAY_KEY_SECRET="..."
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."   # same key_id, exposed to the client
   ```
5. For webhooks, go to **Settings → Webhooks → Create New Webhook**:
   - URL: `https://<your-domain>/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`, `refund.processed`
   - Set a secret and paste it into `RAZORPAY_WEBHOOK_SECRET`.

Test cards / UPI:

- Card: `4111 1111 1111 1111`, any future expiry, any CVV, OTP `1234`
- UPI: `success@razorpay`

### 4. Database

```bash
pnpm db:migrate     # applies migrations + generates client
pnpm db:fts         # applies the FTS (tsvector + GIN) raw migration
pnpm db:seed        # inserts demo data + admin user (INR prices)
```

Seeded admin user: `admin@doothahub.test` / `Admin123!`

### 5. Run

```bash
pnpm dev
```

Open <http://localhost:3000>.

### 6. Local webhooks

Razorpay webhooks need a public URL. Use any tunnel (e.g. `cloudflared`):

```bash
cloudflared tunnel --url http://localhost:3000
# then point the Razorpay dashboard webhook at https://<tunnel>/api/webhooks/razorpay
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
3. In the Razorpay dashboard, add a webhook for `https://<your-domain>/api/webhooks/razorpay`. Paste its secret into `RAZORPAY_WEBHOOK_SECRET`.
4. Run `pnpm db:deploy` once against the production `DIRECT_URL`.

## Architecture decisions

See `.cursor/rules/architecture.mdc` for binding conventions. TL;DR:

- One Next.js app, no monorepo. Modules give 95% of the maintainability with 10% of the overhead.
- Server-first: every fetch is in a Server Component or Server Action. Client components only where needed.
- Prisma client is a singleton (`@/lib/db`). The Razorpay client is **lazily** instantiated (`getRazorpay()` in `@/lib/razorpay`) so importing the module never reads `process.env` at top level — this keeps `next build` happy.
- Services own all DB access; actions and routes go through services.
- `tenantId` is on every tenant-scoped model (nullable today) so future multi-tenancy needs no schema changes.
- Razorpay webhooks are **idempotent** via the `PaymentEvent` table — replays are safe.
