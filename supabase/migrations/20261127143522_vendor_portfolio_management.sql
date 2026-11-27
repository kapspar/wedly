-- Existing public image paths and IDs are preserved.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vendor-portfolio', 'vendor-portfolio', false, 5242880, array['image/jpeg','image/png','image/webp']);

alter table public.vendor_photos
  add column storage_bucket text not null default 'vendor-photos',
  add constraint vendor_photo_storage_bucket check (
    storage_bucket = 'vendor-photos' or (storage_bucket = 'vendor-portfolio' and sort_order >= 3)
  );

-- A single UPDATE can swap gallery positions without a temporary out-of-range slot.
drop index public.unique_vendor_photo_placement;
alter table public.vendor_photos
  add constraint unique_vendor_photo_placement unique (vendor_id, sort_order) deferrable initially immediate;
grant insert (vendor_id, storage_path, storage_bucket, sort_order, alt_text),
  update (sort_order) on public.vendor_photos to service_role;

drop policy "Anyone can view vendor photos" on public.vendor_photos;
create policy "Read published listing images or own photos"
on public.vendor_photos for select to anon, authenticated using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id
      and ((v.is_published and sort_order < 3) or (v.is_claimed and v.claimed_by = (select auth.uid())))
  )
);

create function public.reorder_vendor_portfolio(
  p_vendor_id uuid, p_owner_id uuid, p_current uuid[], p_order uuid[]
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  current_ids uuid[];
  current_slots integer[];
begin
  -- Serialize reorders for this vendor and hold ownership stable through commit.
  perform 1 from public.vendors
  where id = p_vendor_id and is_claimed and claimed_by = p_owner_id for update;
  if not found then return 'forbidden'; end if;

  perform 1 from public.vendor_subscriptions
  where vendor_id = p_vendor_id and owner_id = p_owner_id
    and status = 'active' and nullif(stripe_subscription_id, '') is not null for share;
  if not found then return 'forbidden'; end if;

  select array_agg(p.id order by p.sort_order), array_agg(p.sort_order order by p.sort_order)
  into current_ids, current_slots
  from (
    select id, sort_order from public.vendor_photos
    where vendor_id = p_vendor_id and sort_order >= 3 for update
  ) p;

  if current_ids is null or current_ids is distinct from p_current
    or p_order is null or cardinality(p_order) <> cardinality(current_ids)
    or not (p_order @> current_ids)
  then return 'conflict'; end if;

  update public.vendor_photos photo
  set sort_order = current_slots[position.ordinality::int]
  from unnest(p_order) with ordinality as position(id, ordinality)
  where photo.id = position.id and photo.vendor_id = p_vendor_id;

  return 'ok';
end;
$$;
revoke all on function public.reorder_vendor_portfolio(uuid,uuid,uuid[],uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_vendor_portfolio(uuid,uuid,uuid[],uuid[]) to service_role;

-- Verify ownership and subscription again after storage upload, before attaching the file.
create function public.attach_vendor_photo(p_vendor_id uuid, p_owner_id uuid, p_slot integer, p_path text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  photo_id uuid;
begin
  if p_slot is null or p_slot not between 0 and 17 or p_path is null
    or p_path !~ ('^' || p_vendor_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$')
  then return null; end if;

  perform 1 from public.vendors
  where id = p_vendor_id and is_claimed and claimed_by = p_owner_id for update;
  if not found then return null; end if;

  if p_slot <> 0 then
    perform 1 from public.vendor_subscriptions
    where vendor_id = p_vendor_id and owner_id = p_owner_id
      and status = 'active' and nullif(stripe_subscription_id, '') is not null for share;
    if not found then return null; end if;
  end if;

  insert into public.vendor_photos (vendor_id, storage_path, storage_bucket, sort_order)
  values (p_vendor_id, p_path, case when p_slot >= 3 then 'vendor-portfolio' else 'vendor-photos' end, p_slot)
  returning id into photo_id;
  return photo_id;
end;
$$;
revoke all on function public.attach_vendor_photo(uuid,uuid,integer,text) from public, anon, authenticated;
grant execute on function public.attach_vendor_photo(uuid,uuid,integer,text) to service_role;
