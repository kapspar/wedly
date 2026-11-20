-- Phase 2: test-mode subscription foundation. Apply only when Stripe webhook
-- and service credentials are configured in the server environment.
-- No browser/client role may write paid status.
create table if not exists public.vendor_subscriptions (
  vendor_id uuid primary key references public.vendors(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  billing_interval text check (billing_interval in ('month', 'year')),
  status text not null default 'incomplete',
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  last_stripe_event_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists vendor_subscriptions_customer_idx
  on public.vendor_subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  received_at timestamptz not null default now()
);

alter table public.vendor_subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

revoke all on public.vendor_subscriptions from anon, authenticated;
revoke all on public.stripe_webhook_events from anon, authenticated;
grant select on public.vendor_subscriptions to authenticated;

create policy "Verified owners read their billing status"
  on public.vendor_subscriptions for select to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.vendors v
      where v.id = vendor_id
        and v.claimed_by = (select auth.uid())
        and v.is_claimed = true
    )
  );

comment on table public.vendor_subscriptions is 'Server-managed Stripe billing state; premium entitlement only for active, verified subscriptions.';
comment on table public.stripe_webhook_events is 'Idempotency ledger for signature-verified Stripe test-mode webhook events.';
