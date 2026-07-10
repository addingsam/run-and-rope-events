# Vercel production deployment checklist

Use this when deploying **Run & Rope Events** to Vercel.

## Pre-deploy

- [ ] All Supabase migrations applied (see `supabase/migrations/`)
- [ ] Clerk production instance configured (or promote from dev)
- [ ] Stripe products/prices created (Monthly $9.99, Annual $79.99)
- [ ] Resend domain verified for production `RESEND_FROM_EMAIL`
- [ ] Cloudflare R2 bucket has public read access for flyer URLs
- [ ] Mapbox token created with URL restrictions for your production domain
- [ ] At least one Clerk user has `publicMetadata.role = "admin"` for `/admin`

## Vercel project setup

1. Import the GitHub repo in [Vercel](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `npm run build` (default).
4. `vercel.json` already configures cron jobs:
   - `/api/cron/archive-events` — daily at midnight UTC
   - `/api/cron/notifications` — hourly

## Environment variables (Vercel → Settings → Environment Variables)

Add every **required** variable for **Production**. Use test/sandbox keys in **Preview** if you want staging.

### App

| Variable | Required | Where to get it | Notes |
| -------- | -------- | --------------- | ----- |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Your Vercel domain, e.g. `https://run-and-rope-events.vercel.app` | No trailing slash. Used for Stripe redirects and email links. |

### Supabase

| Variable | Required | Where to get it | Notes |
| -------- | -------- | --------------- | ----- |
| `SUPABASE_URL` | **Yes** | Supabase → Project Settings → API → Project URL | Server-side only. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase → Project Settings → API → `service_role` secret | **Never** expose to the client. |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Same as `SUPABASE_URL` | Not used today; reserved for future client Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase → API → `anon` public key | Not used today. |

### Clerk

| Variable | Required | Where to get it | Notes |
| -------- | -------- | --------------- | ----- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | Clerk → API Keys → Publishable key (`pk_live_...`) | Safe for browser. |
| `CLERK_SECRET_KEY` | **Yes** | Clerk → API Keys → Secret key (`sk_live_...`) | Server only. |
| `CLERK_WEBHOOK_SIGNING_SECRET` | **Yes** | Clerk → Webhooks → endpoint signing secret | For `/api/webhooks/clerk`. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | — | Default: `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | — | Default: `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | No | — | Default: `/events` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | No | — | Default: `/subscribe` |

### Stripe

| Variable | Required | Where to get it | Notes |
| -------- | -------- | --------------- | ----- |
| `STRIPE_SECRET_KEY` | **Yes** | Stripe → Developers → API keys → Secret (`sk_live_...`) | Server only. |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | Stripe → Webhooks → signing secret (`whsec_...`) | For `/api/webhooks/stripe`. |
| `STRIPE_PRICE_MONTHLY_ID` | **Yes** | Stripe → Products → Monthly price ID (`price_...`) | $9.99/mo recurring. |
| `STRIPE_PRICE_ANNUAL_ID` | **Yes** | Stripe → Products → Annual price ID (`price_...`) | $79.99/yr recurring. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe → Publishable key (`pk_live_...`) | **Not used** — checkout uses server-side Stripe Checkout Sessions. |

### Resend

| Variable | Required | Where to get it | Notes |
| -------- | -------- | --------------- | ----- |
| `RESEND_API_KEY` | **Yes** | Resend → API Keys (`re_...`) | Server only. |
| `RESEND_FROM_EMAIL` | **Yes** | Your verified sender, e.g. `Run & Rope Events <hello@yourdomain.com>` | Must match a verified domain in Resend. |

### Mapbox

| Variable | Required | Where to get it | Notes |
| -------- | -------- | --------------- | ----- |
| `MAPBOX_ACCESS_TOKEN` | **Yes** | Mapbox → Access tokens (`pk....`) | Used server-side and passed to the map component. Restrict by HTTP referrer to your production domain. |

### Cloudflare R2

| Variable | Required | Where to get it | Notes |
| -------- | -------- | --------------- | ----- |
| `R2_ACCOUNT_ID` | **Yes** | Cloudflare → R2 → Overview | |
| `R2_ACCESS_KEY_ID` | **Yes** | R2 → Manage R2 API tokens | |
| `R2_SECRET_ACCESS_KEY` | **Yes** | Same API token | Server only. |
| `R2_BUCKET_NAME` | **Yes** | Your bucket name | |
| `R2_PUBLIC_URL` | **Yes** | Public bucket URL or custom domain | No trailing slash. |

### Cron & admin (optional)

| Variable | Required | Where to get it | Notes |
| -------- | -------- | --------------- | ----- |
| `CRON_SECRET` | No | Generate a random string | Optional on Vercel — cron routes also accept `x-vercel-cron: 1`. |
| `ADMIN_SECRET` | No | Generate a random string | Legacy pro-rodeo password form only; `/admin` uses Clerk `role: admin`. |

## Post-deploy webhooks

Configure these URLs using your production `NEXT_PUBLIC_APP_URL`:

### Clerk webhook

- **URL:** `https://<your-domain>/api/webhooks/clerk`
- **Events:** `user.created`, `user.updated`, `session.created`
- Copy signing secret → `CLERK_WEBHOOK_SIGNING_SECRET`

### Stripe webhook

- **URL:** `https://<your-domain>/api/webhooks/stripe`
- **Events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## Post-deploy smoke test

- [ ] Visit `/` — home page loads
- [ ] Sign in via Clerk at `/sign-in`
- [ ] Complete Stripe checkout at `/subscribe`
- [ ] Access `/events` as a subscriber
- [ ] Submit a test event at `/submit` (flyer upload + Resend email)
- [ ] Sign in as admin → review queue at `/admin`
- [ ] Confirm Vercel cron runs (check Functions logs for `/api/cron/notifications`)

## Env var audit

All secrets in this project are read via `process.env` — none are hardcoded in source. The only localhost fallback is `NEXT_PUBLIC_APP_URL` defaulting to `http://localhost:3000` during local development; **set the production URL in Vercel**.

Key files:

| Area | File |
| ---- | ---- |
| Supabase | `src/lib/supabase/server.ts` |
| Clerk | `@clerk/nextjs` (auto) + `src/lib/auth/require-admin.ts` |
| Stripe | `src/lib/stripe/client.ts`, `src/lib/stripe/plans.ts` |
| Resend | `src/lib/email/resend.ts` |
| Mapbox | `src/lib/geocoding/*`, `src/lib/mapbox/directions.ts`, `src/app/events/page.tsx` |
| R2 | `src/lib/r2/client.ts` |
| Cron | `src/lib/cron/verify-cron.ts` |
| App URL | `src/lib/env/app-url.ts` |
