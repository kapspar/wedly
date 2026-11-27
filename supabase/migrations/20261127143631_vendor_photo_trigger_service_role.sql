-- Browser photo writes are already denied by RLS. Preserve the legacy
-- staff path while allowing the service-role attachment function to insert.
create or replace function public.limit_free_vendor_photo()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user <> 'authenticated' then return new; end if;
  if public.is_admin() then return new; end if;

  perform pg_advisory_xact_lock(hashtextextended(new.vendor_id::text, 0));
  if new.sort_order not between 0 and 2 then
    raise exception 'Free listings include a directory image, business logo, and profile banner';
  end if;
  if exists (
    select 1 from public.vendor_photos p
    where p.vendor_id = new.vendor_id and p.sort_order = new.sort_order
  ) then
    raise exception 'This photo placement already has an image';
  end if;
  if new.storage_path not like new.vendor_id::text || '/%' then
    raise exception 'Photo must be stored under its listing folder';
  end if;
  return new;
end;
$$;
