-- Traditions are explicitly selected. Existing culture and ceremony tags are kept as entered.
alter table public.vendor_wedding_experience add column traditions text[] not null default '{}';
alter table public.vendor_wedding_experience add constraint vendor_traditions_allowed check (
  cardinality(traditions) <= 14 and traditions <@ array[
    'tamil-hindu','tamil-catholic','tamil-christian','tamil-muslim','punjabi-sikh','gujarati-hindu',
    'bengali-hindu','south-asian-muslim','east-asian-tea-ceremony','filipino-catholic',
    'caribbean-weddings','west-african-traditional','jewish','interfaith'
  ]::text[]
);
create index vendor_wedding_traditions_idx on public.vendor_wedding_experience using gin(traditions);

create function public.vendors_with_tradition(p_tradition text)
returns setof public.vendors language sql stable security invoker set search_path = '' as $$
  select v.*
  from public.vendors v join public.vendor_wedding_experience e on e.vendor_id = v.id
  where v.is_published and v.is_claimed and e.traditions @> array[p_tradition]
$$;
revoke all on function public.vendors_with_tradition(text) from public;
grant execute on function public.vendors_with_tradition(text) to anon, authenticated;
