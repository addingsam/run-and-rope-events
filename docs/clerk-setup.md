# Clerk authentication

Run & Rope Events uses [Clerk](https://clerk.com) for authentication with persistent device sessions, subscription-gated event access, and device/session limits.

## Environment variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/events
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/subscribe
```

### Stripe subscriptions

Add to `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_ANNUAL_ID=price_...
```

Create two recurring prices in the [Stripe Dashboard](https://dashboard.stripe.com): Monthly ($9.99/mo) and Annual ($79.99/yr). Copy each Price ID into the env vars above.

Run migration `supabase/migrations/20260709183000_add_stripe_subscription_id.sql`.

#### Stripe webhook

1. Open **Developers → Webhooks** → **Add endpoint**.
2. URL: `https://your-domain.com/api/webhooks/stripe` (locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`).
3. Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Checkout lives at `/subscribe`. After payment, Stripe webhooks upsert the `subscribers` row with `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, and `subscription_expires_at`.

Run the Supabase migration `supabase/migrations/20260709181000_clerk_user_ids.sql` so profile IDs store Clerk user IDs.

## Clerk Dashboard setup

### Persistent sign-in

1. Open **Sessions** in the Clerk Dashboard.
2. Enable **Maximum lifetime** and set a long duration (e.g. 365 days) so users stay signed in on their device.
3. Disable **Multi-session handling** (one active session per account is enforced in code as well).

### New device verification (email link, no CAPTCHA)

1. Open **Attack protection** → enable **Client Trust**.
2. Under Client Trust, choose **Email verification link** as the second factor (not CAPTCHA).
3. Ensure **Email** sign-in is enabled under **User & authentication**.
4. Enable **New device sign-in emails** under **Email & SMS** so users are notified of unrecognized devices.

### Subscription access (Supabase `subscribers` table)

Event access requires an **active row** in `public.subscribers` for the signed-in Clerk user ID. Run migration `supabase/migrations/20260709182000_create_subscribers_table.sql`.

Active means `subscription_status` is `active` or `trialing`, and `subscription_expires_at` is null or in the future.

Subscriptions are activated via Stripe Checkout at `/subscribe`. See **Stripe subscriptions** above.

### Webhook

1. Open **Webhooks** → **Add endpoint**.
2. URL: `https://your-domain.com/api/webhooks/clerk` (or use Clerk CLI tunnel locally).
3. Subscribe to: `user.created`, `user.updated`, `session.created`.
4. Copy the signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.

## Device and session limits (app logic)

On every `session.created` webhook:

- **1 active session:** all other active sessions for the user are revoked.
- **2 registered devices:** new `client_id` values are stored in Clerk `privateMetadata.registeredDevices`. A third device is rejected (session revoked).

Client Trust handles email-link verification before the session is created on unrecognized devices.

## Protected routes

Middleware requires sign-in **and** an active row in `public.subscribers` for:

- `/events`
- `/events/[id]`

Unsigned users are redirected to `/subscribe?from=events&auth=required`. Signed-in users without a plan see `/subscribe?from=events&auth=subscribe`.
