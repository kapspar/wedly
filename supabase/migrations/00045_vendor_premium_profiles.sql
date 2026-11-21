-- PR #43: richer premium vendor content. Preserved when subscription lapses,
-- but only displayed publicly if current Premium entitlement is active.
create table public.vendor_premium_profiles (
  vendor_id uuid primary key references public.vendors(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  packages jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  highlights text[] not null default '{}',
  video_urls text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint premium_packages_array check (jsonb_typeof(packages)='array' and jsonb_array_length(packages)<=5),
  constraint premium_faqs_array check (jsonb_typeof(faqs)='array' and jsonb_array_length(faqs)<=5),
  constraint premium_highlight_limit check (cardinality(highlights)<=5),
  constraint premium_video_limit check (cardinality(video_urls)<=3)
);
alter table public.vendor_premium_profiles enable row level security;
revoke all on public.vendor_premium_profiles from public,anon,authenticated;
grant select,insert,update,delete on public.vendor_premium_profiles to service_role;
