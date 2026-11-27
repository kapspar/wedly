-- Existing couple inquiry statuses are independent of private vendor inbox state.
alter table public.inquiries add column event_location text
  check (event_location is null or char_length(event_location) <= 160);


-- The production service role has no default read grants on these tables.
grant select (id, vendor_id, couple_id, message, event_date, event_location, guest_count, budget_cad, created_at)
  on public.inquiries to service_role;
grant select (id, full_name, email) on public.profiles to service_role;

create table public.vendor_inbox_reads (
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (inquiry_id, owner_id)
);
alter table public.vendor_inbox_reads enable row level security;
revoke all on public.vendor_inbox_reads from public, anon, authenticated;
grant select, insert, delete on public.vendor_inbox_reads to service_role;

-- Retain an earlier owner's private notes if the business changes hands.
alter table public.vendor_lead_pipeline drop constraint vendor_lead_pipeline_pkey;
alter table public.vendor_lead_pipeline add primary key (inquiry_id, owner_id);
create index vendor_inquiries_received_idx on public.inquiries(vendor_id, created_at desc, id desc);

create view public.vendor_inbox_entries with (security_invoker = true) as
select i.id, i.vendor_id, v.claimed_by as owner_id, i.couple_id, i.message, i.event_date,
  i.event_location, i.guest_count, i.budget_cad, i.created_at,
  (r.inquiry_id is null) as unread,
  coalesce(l.stage, 'new') as stage,
  l.follow_up_date
from public.inquiries i
join public.vendors v on v.id = i.vendor_id and v.is_claimed and v.claimed_by is not null
left join public.vendor_inbox_reads r on r.inquiry_id = i.id and r.owner_id = v.claimed_by
left join public.vendor_lead_pipeline l on l.inquiry_id = i.id and l.vendor_id = v.id and l.owner_id = v.claimed_by;
revoke all on public.vendor_inbox_entries from public, anon, authenticated;
grant select on public.vendor_inbox_entries to service_role;

create function public.vendor_inbox_metrics(p_owner uuid, p_vendors uuid[])
returns table(vendor_id uuid, total integer, unread integer, open_leads integer, booked integer, due integer)
language sql stable security invoker set search_path = '' as $$
  select e.vendor_id, count(*)::integer, count(*) filter (where e.unread)::integer,
    count(*) filter (where e.stage in ('new','contacted','quoted'))::integer,
    count(*) filter (where e.stage = 'booked')::integer,
    count(*) filter (where e.stage in ('new','contacted','quoted')
      and e.follow_up_date <= (now() at time zone 'America/Toronto')::date)::integer
  from public.vendor_inbox_entries e
  where e.owner_id = p_owner and e.vendor_id = any(p_vendors)
  group by e.vendor_id
$$;
revoke all on function public.vendor_inbox_metrics(uuid,uuid[]) from public, anon, authenticated;
grant execute on function public.vendor_inbox_metrics(uuid,uuid[]) to service_role;

create function public.set_vendor_inquiry_read(p_vendor uuid, p_owner uuid, p_inquiry uuid, p_read boolean)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.vendors
  where id = p_vendor and claimed_by = p_owner and is_claimed for share;
  if not found then return false; end if;
  if not exists (select 1 from public.inquiries where id = p_inquiry and vendor_id = p_vendor)
  then return false; end if;

  if p_read then
    insert into public.vendor_inbox_reads(inquiry_id, owner_id) values (p_inquiry, p_owner)
    on conflict do nothing;
  else
    delete from public.vendor_inbox_reads where inquiry_id = p_inquiry and owner_id = p_owner;
  end if;
  return true;
end;
$$;
revoke all on function public.set_vendor_inquiry_read(uuid,uuid,uuid,boolean) from public, anon, authenticated;
grant execute on function public.set_vendor_inquiry_read(uuid,uuid,uuid,boolean) to service_role;

create function public.save_vendor_inquiry_lead(
  p_vendor uuid, p_owner uuid, p_inquiry uuid, p_stage text, p_notes text, p_follow_up date
) returns text language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.vendors
  where id = p_vendor and claimed_by = p_owner and is_claimed for share;
  if not found then return 'denied'; end if;
  perform 1 from public.vendor_subscriptions
  where vendor_id = p_vendor and owner_id = p_owner and status = 'active'
    and nullif(stripe_subscription_id, '') is not null for share;
  if not found then return 'denied'; end if;
  if not exists (select 1 from public.inquiries where id = p_inquiry and vendor_id = p_vendor)
  then return 'missing'; end if;

  insert into public.vendor_lead_pipeline(inquiry_id, vendor_id, owner_id, stage, notes, follow_up_date)
  values(p_inquiry, p_vendor, p_owner, p_stage, p_notes, p_follow_up)
  on conflict (inquiry_id, owner_id) do update set
    stage = excluded.stage, notes = excluded.notes, follow_up_date = excluded.follow_up_date, updated_at = now();
  return 'ok';
end;
$$;
revoke all on function public.save_vendor_inquiry_lead(uuid,uuid,uuid,text,text,date) from public, anon, authenticated;
grant execute on function public.save_vendor_inquiry_lead(uuid,uuid,uuid,text,text,date) to service_role;
