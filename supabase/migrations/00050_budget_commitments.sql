-- P1-C: track payment commitments independently of existing manual budget-category spending.
-- Each row is scoped to one wedding; cross-wedding references are rejected.
create table public.budget_commitments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  category_id uuid not null references public.budget_categories(id) on delete cascade,
  event_id uuid references public.wedding_events(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  description text not null check(length(btrim(description)) between 1 and 240),
  total_amount numeric(12,2) not null check (total_amount between 0 and 99999999),
  paid_amount numeric(12,2) not null default 0 check (paid_amount between 0 and 99999999),
  due_date date,
  notes text not null default '' check(length(notes)<=2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_commitment_paid_not_more_than_total check (paid_amount <= total_amount)
);
create index budget_commitments_wedding_due on public.budget_commitments (wedding_id,due_date);
create index budget_commitments_category on public.budget_commitments (category_id);

create or replace function public.validate_budget_commitment_links()
returns trigger language plpgsql set search_path='' as $$
begin
  if not exists (select 1 from public.budget_categories b where b.id=new.category_id and b.wedding_id=new.wedding_id) then
    raise exception 'Budget category must belong to this wedding';
  end if;
  if new.event_id is not null and not exists (select 1 from public.wedding_events e where e.id=new.event_id and e.wedding_id=new.wedding_id) then
    raise exception 'Event must belong to this wedding';
  end if;
  return new;
end;
$$;
create trigger validate_budget_commitment_links_trigger
before insert or update of wedding_id,category_id,event_id on public.budget_commitments
for each row execute function public.validate_budget_commitment_links();

alter table public.budget_commitments enable row level security;
create policy "Wedding members read budget commitments" on public.budget_commitments
 for select to authenticated using(public.is_wedding_member(wedding_id));
create policy "Wedding members add budget commitments" on public.budget_commitments
 for insert to authenticated with check(public.is_wedding_member(wedding_id));
create policy "Wedding members edit budget commitments" on public.budget_commitments
 for update to authenticated using(public.is_wedding_member(wedding_id)) with check(public.is_wedding_member(wedding_id));
create policy "Wedding members delete budget commitments" on public.budget_commitments
 for delete to authenticated using(public.is_wedding_member(wedding_id));
grant select,insert,update,delete on public.budget_commitments to authenticated;
