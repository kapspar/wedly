-- PR #36: reports are private and do not automatically hide reviews.
create table public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check(reason in ('not_genuine','privacy','harassment','inaccurate','conflict_of_interest','other')),
  details text not null check(char_length(details) between 20 and 2000),
  status text not null default 'pending' check(status in ('pending','dismissed','upheld')),
  reviewer_note text,
  handled_by uuid references auth.users(id),
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  unique(review_id,reporter_id)
);
create index review_reports_queue_idx on public.review_reports(status,created_at);
alter table public.review_reports enable row level security;
revoke all on public.review_reports from public,anon,authenticated;
grant select,insert,update,delete on public.review_reports to service_role;
