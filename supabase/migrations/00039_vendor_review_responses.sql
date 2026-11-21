-- PR #35: moderated business responses to approved reviews.
-- Customer evidence and unpublished reviews remain server-only.
alter table public.reviews
  add column if not exists vendor_response text check (vendor_response is null or char_length(vendor_response) between 10 and 1500),
  add column if not exists response_status text not null default 'none'
    check (response_status in ('none','pending','approved','rejected')),
  add column if not exists response_submitted_at timestamptz,
  add column if not exists response_moderated_at timestamptz,
  add column if not exists response_moderated_by uuid references auth.users(id);

create index if not exists reviews_pending_vendor_responses
  on public.reviews(response_submitted_at desc)
  where response_status = 'pending';

-- Only service_role can read or write review rows. Public review pages
-- explicitly select and render approved records, never private evidence.
revoke all on public.reviews from anon, authenticated, public;
grant select, insert, update, delete on public.reviews to service_role;
