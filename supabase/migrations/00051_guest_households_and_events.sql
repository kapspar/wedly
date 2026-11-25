-- P1-D: optional household labels and invitations for specific wedding events.
alter table public.guest_list add column if not exists household_name text;
alter table public.guest_list add constraint guest_household_length check (household_name is null or length(household_name) <= 120);
create table if not exists public.guest_event_invitations (
  guest_id uuid not null references public.guest_list(id) on delete cascade,
  event_id uuid not null references public.wedding_events(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending','invited','confirmed','declined')),
  created_at timestamptz not null default now(),
  primary key(guest_id,event_id)
);
create index if not exists guest_event_invitation_wedding_idx on public.guest_event_invitations(wedding_id,event_id);
create or replace function public.validate_guest_event_invitation()
returns trigger language plpgsql set search_path='' as $$
begin
  if not exists(select 1 from public.guest_list g where g.id=new.guest_id and g.wedding_id=new.wedding_id)
    or not exists(select 1 from public.wedding_events e where e.id=new.event_id and e.wedding_id=new.wedding_id) then
    raise exception 'Guest and event must belong to the same wedding';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_guest_event_invitation_trigger on public.guest_event_invitations;
create trigger validate_guest_event_invitation_trigger
before insert or update of guest_id,event_id,wedding_id on public.guest_event_invitations
for each row execute function public.validate_guest_event_invitation();
alter table public.guest_event_invitations enable row level security;
create policy "Wedding members view guest invitations" on public.guest_event_invitations for select to authenticated using(public.is_wedding_member(wedding_id));
create policy "Wedding members add guest invitations" on public.guest_event_invitations for insert to authenticated with check(public.is_wedding_member(wedding_id));
create policy "Wedding members edit guest invitations" on public.guest_event_invitations for update to authenticated using(public.is_wedding_member(wedding_id)) with check(public.is_wedding_member(wedding_id));
create policy "Wedding members delete guest invitations" on public.guest_event_invitations for delete to authenticated using(public.is_wedding_member(wedding_id));
grant select,insert,update,delete on public.guest_event_invitations to authenticated;
