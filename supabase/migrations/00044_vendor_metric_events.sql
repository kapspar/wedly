-- PR #41: privacy-conscious, approximate analytics. A random browser-tab
-- session UUID is counted once per vendor, day and event type. No raw IP,
-- email, user id, or outbound URL is stored in this analytics table.
create table public.vendor_metric_events (
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  event_date date not null,
  kind text not null check(kind in ('view','website','instagram')),
  session_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (vendor_id,event_date,kind,session_id)
);
create index vendor_metric_events_report_idx on public.vendor_metric_events(vendor_id,event_date,kind);
alter table public.vendor_metric_events enable row level security;
revoke all on public.vendor_metric_events from public,anon,authenticated;
grant select,insert,delete on public.vendor_metric_events to service_role;
