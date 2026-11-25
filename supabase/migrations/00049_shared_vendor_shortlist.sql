-- Shared wedding shortlist is independent of individual saved vendors.
create table if not exists public.wedding_vendor_shortlist (
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  stage text not null default 'saved' check (stage in ('saved','contacted','quoted','booked','declined')),
  quote_amount numeric(12,2) check (quote_amount is null or (quote_amount >= 0 and quote_amount <= 99999999)),
  notes text not null default '' check (length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(wedding_id,vendor_id)
);
create index if not exists wedding_vendor_shortlist_by_stage on public.wedding_vendor_shortlist(wedding_id,stage);
alter table public.wedding_vendor_shortlist enable row level security;
create policy "Wedding members can read shortlist" on public.wedding_vendor_shortlist
  for select to authenticated using (public.is_wedding_member(wedding_id));
create policy "Wedding members can add shortlist" on public.wedding_vendor_shortlist
  for insert to authenticated with check (public.is_wedding_member(wedding_id));
create policy "Wedding members can update shortlist" on public.wedding_vendor_shortlist
  for update to authenticated using (public.is_wedding_member(wedding_id)) with check (public.is_wedding_member(wedding_id));
create policy "Wedding members can remove shortlist" on public.wedding_vendor_shortlist
  for delete to authenticated using (public.is_wedding_member(wedding_id));
grant select,insert,update,delete on public.wedding_vendor_shortlist to authenticated;

-- Bring all previously saved listings into the corresponding couple's wedding.
-- Existing saved_vendors rows remain intact.
insert into public.wedding_vendor_shortlist(wedding_id,vendor_id)
select distinct m.wedding_id,s.vendor_id
from public.saved_vendors s
join public.wedding_members m on m.user_id=s.couple_id
on conflict (wedding_id,vendor_id) do nothing;
