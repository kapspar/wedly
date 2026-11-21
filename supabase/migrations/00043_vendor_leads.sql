-- PR #40: voluntary budget per inquiry (available to Free and Premium
-- recipients) and private Premium-only lead pipeline state.
alter table public.inquiries add column if not exists budget_cad integer
  check (budget_cad is null or budget_cad between 1 and 1000000);

create table public.vendor_lead_pipeline (
  inquiry_id uuid primary key references public.inquiries(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  stage text not null default 'new'
    check (stage in ('new','contacted','quoted','booked','lost')),
  notes text check(notes is null or char_length(notes)<=2000),
  follow_up_date date,
  updated_at timestamptz not null default now()
);
create index vendor_lead_pipeline_vendor_idx on public.vendor_lead_pipeline(vendor_id,stage);
alter table public.vendor_lead_pipeline enable row level security;
revoke all on public.vendor_lead_pipeline from public,anon,authenticated;
grant select,insert,update,delete on public.vendor_lead_pipeline to service_role;
