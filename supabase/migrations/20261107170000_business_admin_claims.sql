-- Apply in Supabase SQL editor after reviewing PR. No automatic production migration.
create table if not exists public.admin_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('owner','business_admin')),
 created_at timestamptz not null default now()
);
alter table public.admin_access enable row level security;
revoke all on public.admin_access from anon;
grant select on public.admin_access to authenticated;
create policy "Staff can view own access" on public.admin_access for select to authenticated using (user_id = (select auth.uid()));

-- Existing profile role must never be self-promotable.
create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql set search_path = '' as $$
begin
 if new.role is distinct from old.role then
   if current_user not in ('postgres','service_role') then
     raise exception 'Profile role changes require privileged administration';
   end if;
 end if;
 return new;
end $$;
drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change before update on public.profiles
for each row execute function public.prevent_profile_role_change();

-- Retain existing is_admin() contract for existing admin RLS and middleware.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (
 select 1 from public.admin_access where user_id = (select auth.uid())
 and role in ('owner','business_admin')
) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
alter policy "Admins can view all profiles" on public.profiles to authenticated;

create table if not exists public.vendor_claims (
 id uuid primary key default gen_random_uuid(),
 vendor_id uuid not null references public.vendors(id) on delete cascade,
 requester_id uuid not null references auth.users(id) on delete cascade,
 business_email text not null,
 evidence_url text,
 explanation text not null,
 status text not null default 'pending' check (status in ('pending','approved','rejected','more_info')),
 review_note text,
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create unique index if not exists vendor_claims_one_pending_per_user
on public.vendor_claims(vendor_id, requester_id) where status='pending';
create index if not exists vendor_claims_status_created on public.vendor_claims(status,created_at desc);
alter table public.vendor_claims enable row level security;
revoke all on public.vendor_claims from anon;
grant select,insert on public.vendor_claims to authenticated;
create policy "Requester or staff can view claims" on public.vendor_claims
for select to authenticated using (requester_id = (select auth.uid()) or (select public.is_admin()));
create policy "Signed in users request their own claim" on public.vendor_claims
for insert to authenticated with check (
 requester_id = (select auth.uid()) and status='pending'
 and reviewed_by is null and reviewed_at is null and review_note is null
 and length(trim(explanation)) between 20 and 3000
 and length(trim(business_email)) between 5 and 254
 and (evidence_url is null or evidence_url ~ '^https://')
);

-- The review operation is atomic and records who made the decision.
create or replace function public.review_vendor_claim(
 p_claim_id uuid, p_decision text, p_note text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_claim public.vendor_claims%rowtype;
begin
 if not exists (select 1 from public.admin_access where user_id=auth.uid()
 and role in ('owner','business_admin')) then
   raise exception 'Not authorized';
 end if;
 if p_decision not in ('approved','rejected','more_info') then
   raise exception 'Invalid decision';
 end if;
 if p_decision <> 'approved' and nullif(trim(coalesce(p_note,'')),'') is null then
   raise exception 'A review note is required';
 end if;
 select * into v_claim from public.vendor_claims where id=p_claim_id for update;
 if not found or v_claim.status <> 'pending' then
   raise exception 'Claim is no longer pending';
 end if;
 if p_decision='approved' then
   update public.vendors set claimed_by=v_claim.requester_id,is_claimed=true
   where id=v_claim.vendor_id and claimed_by is null;
   if not found then raise exception 'Vendor already claimed'; end if;
 end if;
 update public.vendor_claims set status=p_decision,review_note=nullif(trim(p_note),''),
 reviewed_by=auth.uid(),reviewed_at=now() where id=p_claim_id;
end $$;
revoke all on function public.review_vendor_claim(uuid,text,text) from public;
grant execute on function public.review_vendor_claim(uuid,text,text) to authenticated;

-- IMPORTANT: Bootstrap owner by verified auth.users UUID, never by an email guessed in code:
-- insert into public.admin_access(user_id,role) values ('<verified-owner-auth-user-uuid>','owner');
-- Only after the partner has signed up and their UUID is verified:
-- insert into public.admin_access(user_id,role) values ('<verified-partner-auth-user-uuid>','business_admin');
