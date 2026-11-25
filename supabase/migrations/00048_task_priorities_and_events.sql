-- Organize existing wedding tasks without replacing or changing their original IDs.
alter table public.tasks
  add column if not exists priority text not null default 'normal',
  add column if not exists event_id uuid references public.wedding_events(id) on delete set null;
alter table public.tasks
  add constraint tasks_priority_allowed check (priority in ('high','normal','low'));
create index if not exists tasks_wedding_due_date_idx on public.tasks(wedding_id, due_date);
create index if not exists tasks_event_id_idx on public.tasks(event_id);

-- Enforce that a task can only refer to an event belonging to the same wedding,
-- even if a shared-workspace client attempts to use another wedding's event.
create or replace function public.check_task_event_wedding()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.event_id is not null and not exists (
    select 1 from public.wedding_events e
    where e.id = new.event_id and e.wedding_id = new.wedding_id
  ) then
    raise exception 'Task event must belong to the same wedding';
  end if;
  return new;
end;
$$;
drop trigger if exists check_task_event_wedding_trigger on public.tasks;
create trigger check_task_event_wedding_trigger
before insert or update of event_id, wedding_id on public.tasks
for each row execute function public.check_task_event_wedding();
