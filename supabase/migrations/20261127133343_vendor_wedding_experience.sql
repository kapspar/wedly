create table public.vendor_wedding_experience (
  vendor_id uuid primary key references public.vendors(id) on delete cascade,
  cultures text[] not null default '{}',
  ceremonies text[] not null default '{}',
  notes text not null default '',
  category_details jsonb not null default '{}',
  constraint vendor_experience_cultures check (
    cardinality(cultures) <= 12 and cultures <@ array[
      'Tamil', 'Punjabi', 'Gujarati', 'Bengali', 'Other South Asian', 'East Asian',
      'Filipino', 'Caribbean', 'African', 'Middle Eastern', 'European', 'Multicultural'
    ]::text[]
  ),
  constraint vendor_experience_ceremonies check (
    cardinality(ceremonies) <= 9 and ceremonies <@ array[
      'Hindu', 'Catholic', 'Christian', 'Muslim / Nikah', 'Sikh / Anand Karaj',
      'Buddhist', 'Jewish', 'Civil / secular', 'Interfaith'
    ]::text[]
  ),
  constraint vendor_experience_notes check (char_length(notes) <= 600),
  constraint vendor_experience_category_details check (
    jsonb_typeof(category_details) = 'object'
    and octet_length(category_details::text) <= 40000
    and not jsonb_path_exists(category_details, 'strict $.* ? (@.type() != "object")')
    and not jsonb_path_exists(category_details, 'strict $.*.* ? (@.type() != "string")')
  )
);

alter table public.vendor_wedding_experience enable row level security;
revoke all on public.vendor_wedding_experience from public, anon, authenticated;
grant select on public.vendor_wedding_experience to anon, authenticated;
grant insert, update on public.vendor_wedding_experience to authenticated;

create policy "Read experience for published or owned listings"
on public.vendor_wedding_experience for select to anon, authenticated using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id and v.is_claimed
      and (v.is_published or v.claimed_by = (select auth.uid()))
  )
);

create policy "Claimed listing owners create experience"
on public.vendor_wedding_experience for insert to authenticated with check (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id and v.is_claimed and v.claimed_by = (select auth.uid())
  )
);

create policy "Claimed listing owners update experience"
on public.vendor_wedding_experience for update to authenticated using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id and v.is_claimed and v.claimed_by = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id and v.is_claimed and v.claimed_by = (select auth.uid())
  )
);
