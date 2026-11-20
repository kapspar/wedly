-- PR #33: private review submission and admin verification foundation.
-- No public ratings until a separate vetted public-display release.
alter table public.reviews
  add column if not exists communication_rating smallint check (communication_rating between 1 and 5),
  add column if not exists quality_rating smallint check (quality_rating between 1 and 5),
  add column if not exists value_rating smallint check (value_rating between 1 and 5),
  add column if not exists reliability_rating smallint check (reliability_rating between 1 and 5),
  add column if not exists service_date date,
  add column if not exists evidence_path text,
  add column if not exists moderation_status text not null default 'pending'
    check (moderation_status in ('pending','approved','rejected')),
  add column if not exists customer_verified boolean not null default false,
  add column if not exists moderation_note text,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references auth.users(id);

create unique index if not exists reviews_one_per_reviewer_vendor
  on public.reviews(vendor_id, couple_id);
create index if not exists reviews_moderation_queue
  on public.reviews(moderation_status,created_at desc);

-- Old public SELECT and authenticated INSERT policies predate moderation.
-- All review writes and reads now go through authenticated server handlers.
drop policy if exists "Anyone can view approved reviews" on public.reviews;
drop policy if exists "Couples can create reviews" on public.reviews;
revoke all on public.reviews from anon,authenticated,public;
grant select,insert,update,delete on public.reviews to service_role;
alter table public.reviews enable row level security;

-- Evidence is NEVER public. All access through restricted server handlers.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('review-evidence','review-evidence',false,5242880,
 array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
set public=false,file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;
