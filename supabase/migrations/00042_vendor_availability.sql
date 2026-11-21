-- PR #39: manual premium availability. Dates are public only through
-- server components when an eligible listing has an active subscription.
create table public.vendor_availability (
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  available_date date not null,
  status text not null check (status in ('available','tentative','booked','unavailable')),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (vendor_id,available_date)
);
create index vendor_availability_future on public.vendor_availability(available_date);
alter table public.vendor_availability enable row level security;
revoke all on public.vendor_availability from public,anon,authenticated;
grant select,insert,update,delete on public.vendor_availability to service_role;
