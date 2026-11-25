
-- Public RSVP access is by a cryptographically random, revocable token.
-- Tokens are NOT exposed by the guest list, and guests cannot query other invitations.
create table public.guest_rsvp_links (
  guest_id uuid primary key references public.guest_list(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.guest_rsvp_links enable row level security;
-- No direct table grants or policies for clients; accessed through vetted functions only.

create or replace function public.create_guest_rsvp_link(p_guest uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_wedding uuid;v_token uuid;
begin
 select wedding_id into v_wedding from public.guest_list where id=p_guest;
 if v_wedding is null or not public.is_wedding_member(v_wedding) then raise exception 'Guest not found'; end if;
 if not exists (select 1 from public.guest_event_invitations where guest_id=p_guest and wedding_id=v_wedding) then
   raise exception 'Add at least one event invitation for this guest first';
 end if;
 insert into public.guest_rsvp_links(guest_id,wedding_id) values(p_guest,v_wedding)
 on conflict(guest_id) do update set guest_id=excluded.guest_id returning token into v_token;
 return v_token;
end $$;

create or replace function public.revoke_guest_rsvp_link(p_guest uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_wedding uuid;
begin
 select wedding_id into v_wedding from public.guest_list where id=p_guest;
 if v_wedding is null or not public.is_wedding_member(v_wedding) then raise exception 'Guest not found';end if;
 delete from public.guest_rsvp_links where guest_id=p_guest;
end $$;

create or replace function public.get_guest_rsvp(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_guest uuid;v_wedding uuid;v_result jsonb;
begin
 select guest_id,wedding_id into v_guest,v_wedding from public.guest_rsvp_links where token=p_token;
 if v_guest is null then return null;end if;
 select jsonb_build_object(
   'guest',g.name,'party_size',g.party_size,
   'couple',w.partner1_name||' & '||w.partner2_name,
   'events',coalesce((
     select jsonb_agg(jsonb_build_object(
       'id',i.event_id,'name',coalesce(nullif(e.custom_label,''),initcap(replace(e.event_type::text,'_',' '))),
       'date',e.event_date,'status',i.rsvp_status
     ) order by e.sort_order)
     from public.guest_event_invitations i
     join public.wedding_events e on e.id=i.event_id
     where i.guest_id=v_guest and i.wedding_id=v_wedding
   ),'[]'::jsonb))
 into v_result from public.guest_list g join public.weddings w on w.id=g.wedding_id
 where g.id=v_guest and g.wedding_id=v_wedding;
 return v_result;
end $$;

create or replace function public.submit_guest_rsvp(p_token uuid,p_event uuid,p_response text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_guest uuid;v_wedding uuid;v_count int;v_confirmed int;v_declined int;
begin
 if p_response not in ('confirmed','declined') then raise exception 'Invalid RSVP';end if;
 select guest_id,wedding_id into v_guest,v_wedding from public.guest_rsvp_links where token=p_token;
 if v_guest is null then return false;end if;
 update public.guest_event_invitations
 set rsvp_status=p_response
 where guest_id=v_guest and wedding_id=v_wedding and event_id=p_event;
 if not found then return false;end if;
 select count(*),count(*) filter(where rsvp_status='confirmed'),count(*) filter(where rsvp_status='declined')
 into v_count,v_confirmed,v_declined
 from public.guest_event_invitations where guest_id=v_guest and wedding_id=v_wedding;
 update public.guest_list set
   rsvp_status=case when v_count=v_confirmed then 'confirmed'
     when v_count=v_declined then 'declined' else 'invited' end,
   updated_at=now()
 where id=v_guest and wedding_id=v_wedding;
 return true;
end $$;

revoke all on public.guest_rsvp_links from anon,authenticated;
revoke all on function public.create_guest_rsvp_link(uuid) from public;
revoke all on function public.revoke_guest_rsvp_link(uuid) from public;
revoke all on function public.get_guest_rsvp(uuid) from public;
revoke all on function public.submit_guest_rsvp(uuid,uuid,text) from public;
grant execute on function public.create_guest_rsvp_link(uuid),public.revoke_guest_rsvp_link(uuid) to authenticated;
grant execute on function public.get_guest_rsvp(uuid),public.submit_guest_rsvp(uuid,uuid,text) to anon,authenticated;

-- Templates are copied as opt-in, non-sensitive snapshots. Access only via functions.
create table public.wedding_plan_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text not null default '',
  wedding_type text not null check (wedding_type in ('hindu','christian_catholic','interfaith')),
  is_curated boolean not null default false,
  share_token uuid unique,
  creator_wedding_id uuid references public.weddings(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  check (is_curated or share_token is not null)
);
create index wedding_templates_created_idx on public.wedding_plan_templates(created_at);
alter table public.wedding_plan_templates enable row level security;
revoke all on public.wedding_plan_templates from anon,authenticated;

insert into public.wedding_plan_templates(slug,title,description,wedding_type,is_curated,payload) values
('tamil-hindu','Tamil Hindu wedding','A customizable starting point for family celebrations and a temple ceremony. Traditions vary by family.','hindu', 'true',
'{"events":["engagement","home_ceremony","temple_ceremony","reception"],"tasks":["Discuss family traditions and ceremony priorities","Confirm priest and ceremony requirements","Book the temple or ceremony venue","Plan wedding attire, jewellery and accessories","Arrange photography and video coverage","Confirm catering and dietary requirements","Create and review guest lists for each event","Track deposits and final payment dates","Confirm ceremony timeline with family and vendors"],"budgets":[{"category":"venue","budgeted":15000},{"category":"catering","budgeted":10000},{"category":"photography","budgeted":3000},{"category":"decor","budgeted":5000},{"category":"priest","budgeted":500}]}'::jsonb),
('tamil-christian','Tamil Christian / Catholic wedding','A flexible plan for church ceremonies and receptions. Confirm denomination-specific requirements locally.','christian_catholic','true',
'{"events":["engagement","church_ceremony","reception"],"tasks":["Confirm church booking and preparation requirements","Meet with priest, pastor or officiant","Plan ceremony music and readings","Confirm reception venue and meal","Book photography and videography","Review wedding party outfits and accessories","Create guest lists and collect RSVPs","Review vendor payments and deposits","Finalize ceremony and reception schedule"],"budgets":[{"category":"venue","budgeted":15000},{"category":"catering","budgeted":10000},{"category":"photography","budgeted":3000},{"category":"decor","budgeted":5000},{"category":"attire","budgeted":3000}]}'::jsonb),
('tamil-interfaith','Tamil interfaith wedding','Plan multiple ceremonies or a blended celebration with both families.','interfaith','true',
'{"events":["engagement","temple_ceremony","church_ceremony","reception"],"tasks":["Talk with both families about traditions and expectations","Confirm each ceremony venue and officiant","Choose which events to include and in what order","Coordinate cultural clothing and ceremony essentials","Build guest lists for each celebration","Compare shared vendors across both ceremonies","Check travel time and logistics between venues","Review total budget and deposits","Confirm final schedules with both families"],"budgets":[{"category":"venue","budgeted":15000},{"category":"catering","budgeted":10000},{"category":"photography","budgeted":3000},{"category":"decor","budgeted":5000},{"category":"attire","budgeted":3000}]}'::jsonb);

create or replace function public.get_wedding_plan_template(p_slug text default null,p_token uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v jsonb;
begin
 if p_slug is null and p_token is null then return null;end if;
 select jsonb_build_object('title',t.title,'description',t.description,
 'type',t.wedding_type,'events',t.payload->'events','tasks',t.payload->'tasks','budgets',t.payload->'budgets')
 into v from public.wedding_plan_templates t
 where (p_slug is not null and t.slug=p_slug and t.is_curated)
    or (p_token is not null and t.share_token=p_token)
 limit 1;
 return v;
end $$;

create or replace function public.create_wedding_plan_share(p_wedding uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_type text;v_title text;v_token uuid;v_payload jsonb;
begin
 if not public.is_wedding_member(p_wedding) then raise exception 'Not a member of this wedding';end if;
 select w.wedding_type::text into v_type from public.weddings w where w.id=p_wedding;
 if v_type is null then raise exception 'Wedding not found';end if;
 select jsonb_build_object(
   'events',coalesce((select jsonb_agg(e.event_type::text order by e.sort_order)
    from public.wedding_events e where e.wedding_id=p_wedding),'[]'::jsonb),
   'tasks',coalesce((select jsonb_agg(t.title order by t.sort_order)
    from public.tasks t where t.wedding_id=p_wedding),'[]'::jsonb),
   'budgets',coalesce((select jsonb_agg(jsonb_build_object('category',b.category,'budgeted',b.budgeted) order by b.category)
    from public.budget_categories b where b.wedding_id=p_wedding and b.is_enabled),'[]'::jsonb)
 ) into v_payload;
 v_token:=gen_random_uuid();
 insert into public.wedding_plan_templates(title,description,wedding_type,share_token,creator_wedding_id,payload)
 values('Shared wedding planning template','A reusable starting plan. No guest details, payments, vendors or notes included.',v_type,v_token,p_wedding,v_payload);
 return v_token;
end $$;

create or replace function public.apply_wedding_plan_template(p_wedding uuid,p_slug text default null,p_token uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_payload jsonb;v_events int:=0;v_tasks int:=0;v_budgets int:=0;
begin
 if not public.is_wedding_member(p_wedding) then raise exception 'You do not have access to this wedding';end if;
 if p_slug is null and p_token is null then raise exception 'Choose a template';end if;
 select t.payload into v_payload from public.wedding_plan_templates t
 where (p_slug is not null and t.slug=p_slug and t.is_curated)
    or (p_token is not null and t.share_token=p_token) limit 1;
 if v_payload is null then raise exception 'Template not found';end if;
 if jsonb_array_length(coalesce(v_payload->'events','[]'::jsonb))>15
    or jsonb_array_length(coalesce(v_payload->'tasks','[]'::jsonb))>100
    or jsonb_array_length(coalesce(v_payload->'budgets','[]'::jsonb))>40 then
   raise exception 'Template is too large';
 end if;
 with incoming as (
  select distinct value::public.event_type as kind from jsonb_array_elements_text(coalesce(v_payload->'events','[]'::jsonb))
 ), added as (
  insert into public.wedding_events(wedding_id,event_type,sort_order)
  select p_wedding,kind,(select coalesce(max(sort_order),0) from public.wedding_events where wedding_id=p_wedding)+row_number() over(order by kind)
  from incoming i where not exists(select 1 from public.wedding_events e where e.wedding_id=p_wedding and e.event_type=i.kind)
  returning id
 ) select count(*) into v_events from added;
 with incoming as (
  select distinct btrim(value) as title from jsonb_array_elements_text(coalesce(v_payload->'tasks','[]'::jsonb))
 ), added as (
  insert into public.tasks(wedding_id,title,sort_order)
  select p_wedding,title,(select coalesce(max(sort_order),0) from public.tasks where wedding_id=p_wedding)+row_number() over(order by title)
  from incoming i where length(i.title) between 1 and 240 and not exists(
    select 1 from public.tasks t where t.wedding_id=p_wedding and lower(t.title)=lower(i.title))
  returning id
 ) select count(*) into v_tasks from added;
 with incoming as (
  select distinct on (category) btrim(category) category,budgeted from jsonb_to_recordset(coalesce(v_payload->'budgets','[]'::jsonb))
  as b(category text,budgeted numeric) where length(btrim(category)) between 1 and 80 and budgeted between 0 and 99999999 order by category
 ), added as (
  insert into public.budget_categories(wedding_id,category,budgeted,is_enabled)
  select p_wedding,i.category,i.budgeted,true from incoming i where not exists(
   select 1 from public.budget_categories b where b.wedding_id=p_wedding and lower(b.category)=lower(i.category))
  returning id
 ) select count(*) into v_budgets from added;
 return jsonb_build_object('events',v_events,'tasks',v_tasks,'budgets',v_budgets);
end $$;

revoke all on function public.get_wedding_plan_template(text,uuid) from public;
revoke all on function public.create_wedding_plan_share(uuid) from public;
revoke all on function public.apply_wedding_plan_template(uuid,text,uuid) from public;
grant execute on function public.get_wedding_plan_template(text,uuid) to anon,authenticated;
grant execute on function public.create_wedding_plan_share(uuid),public.apply_wedding_plan_template(uuid,text,uuid) to authenticated;
