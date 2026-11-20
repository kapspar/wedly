-- Prevent overlapping Stripe Checkout sessions for the same verified vendor.
-- Reservations are server-managed and expire slightly after the associated
-- Stripe Checkout session expires; no privileges are granted to browser roles.
create table if not exists public.vendor_checkout_reservations (
  vendor_id uuid primary key references public.vendors(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  reservation_token uuid not null default gen_random_uuid(),
  expires_at timestamptz not null,
  stripe_session_id text,
  created_at timestamptz not null default now()
);

alter table public.vendor_checkout_reservations enable row level security;
revoke all on table public.vendor_checkout_reservations from anon, authenticated, public;
grant select, insert, update, delete on table public.vendor_checkout_reservations to service_role;

create or replace function public.reserve_vendor_checkout(p_vendor_id uuid, p_owner_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_token uuid;
begin
  insert into public.vendor_checkout_reservations
    (vendor_id, owner_id, reservation_token, expires_at, created_at)
  values
    (p_vendor_id, p_owner_id, gen_random_uuid(), now() + interval '35 minutes', now())
  on conflict (vendor_id) do update
    set owner_id = excluded.owner_id,
        reservation_token = excluded.reservation_token,
        expires_at = excluded.expires_at,
        stripe_session_id = null,
        created_at = excluded.created_at
    where public.vendor_checkout_reservations.expires_at <= now()
  returning reservation_token into v_token;
  return v_token; -- null when another unexpired checkout reservation exists
end;
$$;

revoke all on function public.reserve_vendor_checkout(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_vendor_checkout(uuid, uuid) to service_role;
