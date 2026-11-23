
-- Shared wedding collaboration. Keep existing weddings and couple_id ownership intact.
create table if not exists public.wedding_members (
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('owner','partner')),
 joined_at timestamptz not null default now(),
 primary key(wedding_id,user_id)
);
create unique index if not exists wedding_one_owner on public.wedding_members(wedding_id) where role='owner';
create index if not exists wedding_members_by_user on public.wedding_members(user_id);
insert into public.wedding_members(wedding_id,user_id,role)
select id,couple_id,'owner' from public.weddings
on conflict (wedding_id,user_id) do nothing;

create or replace function public.add_wedding_owner()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.wedding_members(wedding_id,user_id,role) values(new.id,new.couple_id,'owner');
 return new;
end $$;
drop trigger if exists add_wedding_owner_trigger on public.weddings;
create trigger add_wedding_owner_trigger after insert on public.weddings
for each row execute function public.add_wedding_owner();

create or replace function public.is_wedding_member(p_wedding uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.wedding_members m where m.wedding_id=p_wedding and m.user_id=(select auth.uid()))
$$;
revoke all on function public.is_wedding_member(uuid) from public;
grant execute on function public.is_wedding_member(uuid) to authenticated;

alter table public.wedding_members enable row level security;
create policy "Members can view wedding membership" on public.wedding_members for select to authenticated
 using (public.is_wedding_member(wedding_id));
-- Membership is only changed by trusted database functions, not direct client inserts.
revoke insert,update,delete on public.wedding_members from anon,authenticated;
grant select on public.wedding_members to authenticated;

create table if not exists public.wedding_invitations (
 id uuid primary key default gen_random_uuid(),
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 email text not null,
 token uuid not null unique default gen_random_uuid(),
 expires_at timestamptz not null default (now() + interval '14 days'),
 accepted_at timestamptz,
 created_at timestamptz not null default now(),
 check(length(email)<=254)
);
create index if not exists wedding_invitations_wedding on public.wedding_invitations(wedding_id);
alter table public.wedding_invitations enable row level security;
revoke all on public.wedding_invitations from anon,authenticated;

create or replace function public.create_partner_invitation(p_wedding uuid, p_email text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_token uuid; v_email text := lower(btrim(p_email));
begin
 if auth.uid() is null or not exists (
   select 1 from public.weddings where id=p_wedding and couple_id=auth.uid()
 ) then raise exception 'Only the wedding owner may invite a partner'; end if;
 if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(v_email)>254 then
   raise exception 'Enter a valid email address'; end if;
 if lower(coalesce((select email from auth.users where id=auth.uid()),''))=v_email then
   raise exception 'Invite someone other than yourself'; end if;
 if (select count(*) from public.wedding_members where wedding_id=p_wedding)>=2 then
   raise exception 'This wedding already has two members'; end if;
 delete from public.wedding_invitations where wedding_id=p_wedding and accepted_at is null;
 insert into public.wedding_invitations(wedding_id,email) values(p_wedding,v_email) returning token into v_token;
 return v_token;
end $$;

create or replace function public.accept_partner_invitation(p_token uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_inv public.wedding_invitations%rowtype; v_email text; v_wedding uuid;
begin
 if auth.uid() is null then raise exception 'Sign in to accept an invitation'; end if;
 select lower(email) into v_email from auth.users where id=auth.uid();
 select * into v_inv from public.wedding_invitations where token=p_token for update;
 if not found or v_inv.accepted_at is not null or v_inv.expires_at<now() or v_inv.email<>v_email then
   raise exception 'This invitation is invalid, expired, or for a different email'; end if;
 if (select count(*) from public.wedding_members where wedding_id=v_inv.wedding_id)>=2 then
   raise exception 'This wedding already has two members'; end if;
 if exists(select 1 from public.wedding_members where user_id=auth.uid() and wedding_id<>v_inv.wedding_id)
    or exists(select 1 from public.weddings where couple_id=auth.uid() and id<>v_inv.wedding_id) then
   raise exception 'Your account already belongs to another wedding'; end if;
 insert into public.wedding_members(wedding_id,user_id,role) values(v_inv.wedding_id,auth.uid(),'partner')
 on conflict do nothing;
 update public.wedding_invitations set accepted_at=now() where id=v_inv.id;
 v_wedding:=v_inv.wedding_id;
 return v_wedding;
end $$;
revoke all on function public.create_partner_invitation(uuid,text) from public;
revoke all on function public.accept_partner_invitation(uuid) from public;
grant execute on function public.create_partner_invitation(uuid,text) to authenticated;
grant execute on function public.accept_partner_invitation(uuid) to authenticated;

create policy "Partners can read shared wedding" on public.weddings for select to authenticated
 using (public.is_wedding_member(id));
create policy "Partners can update shared wedding" on public.weddings for update to authenticated
 using (public.is_wedding_member(id))
 with check (public.is_wedding_member(id));
-- Protect the original owner pointer, including from partner edits.
create or replace function public.prevent_wedding_owner_change()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.couple_id is distinct from old.couple_id then raise exception 'Wedding owner cannot be reassigned'; end if;
 return new;
end $$;
drop trigger if exists prevent_wedding_owner_change_trigger on public.weddings;
create trigger prevent_wedding_owner_change_trigger before update on public.weddings for each row execute function public.prevent_wedding_owner_change();

create policy "Partners can manage shared budget" on public.budget_categories for all to authenticated
 using (public.is_wedding_member(wedding_id)) with check (public.is_wedding_member(wedding_id));
create policy "Partners can manage shared events" on public.wedding_events for all to authenticated
 using (public.is_wedding_member(wedding_id)) with check (public.is_wedding_member(wedding_id));
create policy "Partners can manage shared tasks" on public.tasks for all to authenticated
 using (public.is_wedding_member(wedding_id)) with check (public.is_wedding_member(wedding_id));
create policy "Partners can manage shared guests" on public.guest_list for all to authenticated
 using (public.is_wedding_member(wedding_id)) with check (public.is_wedding_member(wedding_id));
