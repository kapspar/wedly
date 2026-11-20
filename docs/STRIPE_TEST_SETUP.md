# Phase 2 — Stripe test-mode subscriptions

This PR is a **test-mode foundation**, not a live payments launch. Existing Free listings remain Free. No Premium gallery, analytics, or paid access gates are enabled yet.

## Prices (CAD, no free trial)

- Premium Monthly: **CAD $29.00** every month
- Premium Annual: **CAD $290.00** every year (CAD $58 less than twelve monthly payments)
- Featured placement: **out of scope**

## What the PR adds

- Supabase migration `00033_vendor_stripe_subscriptions.sql` (server-managed subscription status; only verified vendors may SELECT their own status, never write it).
- `POST /api/billing/checkout`: checks the logged-in account is the *verified owner* of the supplied listing before creating a Stripe-hosted test Checkout session.
- `POST /api/stripe/webhook`: verifies Stripe's signature against the **raw** body, rejects live-mode events, deduplicates Stripe event IDs, and updates billing records only for subscription events with trusted Stripe subscription metadata.
- `POST /api/billing/portal`: checked vendor owner opens Stripe's hosted billing portal.
- Vendor dashboard test buttons appear **only** when Stripe's test configuration and webhook credentials are present. The test billing status comes from server-side records.

## Setup needed in Stripe Dashboard — TEST MODE ONLY

1. Enable **test mode** in your Stripe Dashboard and finish any onboarding required to access test API keys.
2. Create a Product named `PlanWedly Premium`, and two **recurring** prices in `CAD`: `2900` cents / month and `29000` cents / year. Do not add a trial.
3. Copy the two **test price IDs** (`price_...`), and your test secret key (`sk_test_...`). Do not paste keys into chat or check them into Git.
4. In Stripe test-mode webhooks, create an endpoint at `https://planwedly.com/api/stripe/webhook` **after deploying the code**. Subscribe to `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`. Copy its test signing secret (`whsec_...`).
5. Create/configure the Stripe test customer portal (payment method updates and cancellation). Do not enable plan changes without explicitly designing your proration/entitlement rules.
6. In Vercel, set server-only environment variables for your intended test deployment:

   - `STRIPE_SECRET_KEY` = test `sk_test_...`
   - `STRIPE_PRICE_MONTHLY` = actual monthly test `price_...`
   - `STRIPE_PRICE_YEARLY` = actual yearly test `price_...`
   - `STRIPE_WEBHOOK_SECRET` = endpoint signing secret `whsec_...`
   - `SUPABASE_SERVICE_ROLE_KEY` = existing Supabase **secret** service-role key, if not already set

   **Never** use `NEXT_PUBLIC_` for these keys. Environment scopes must match the deployed frontend and webhook endpoint. A preview URL requires its own Stripe webhook endpoint and signing secret; do not reuse the production URL's secret.
7. Apply the SQL migration to the intended Supabase database *before enabling checkout*. Do not add subscription records manually.
8. Redeploy the intended Vercel environment after setting variables.

**The application explicitly rejects `sk_live_` keys and `livemode: true` events.** Upgrading to live charging requires a separate reviewed change.

## Test checklist

- Verify both Stripe prices are correct in CAD and recurring monthly/annual before clicking checkout.
- Log in as a **verified vendor**, open the dashboard, and initiate each test Checkout price.
- Complete payment using Stripe's official test card details; observe `active` in server-derived subscription status.
- Cancel from the billing portal and verify subscription status changes when Stripe's signed event is delivered.
- Confirm an unauthenticated user gets 401 and a different vendor gets 403 on checkout and portal routes.
- Re-send the same webhook event: no duplicate database processing.
- Send bad signature / stale timestamp / live event: rejected with no subscription modifications.
- Confirm Free listings are still available and no Premium benefits have accidentally been granted.

## Known limitations before monetization launch

- Premium entitlement gating for expanded portfolio/gallery, analytics, and profile customization is **not yet implemented**. An active test subscription does not turn these features on.
- Webhook event ledger deduplication and subscription records need production load/retry and out-of-order event testing. Avoid parallel subscription creation for a single listing until edge-case handling is complete.
- Price IDs cannot be configured automatically without accessing your Stripe account. There is no Stripe account integration in this workspace, so this PR prepares code only.
- Tax registration, GST/HST application, Stripe Tax, and legal checkout disclosure need a separate launch review.
- No real payments should be accepted until a separate production cutover.
