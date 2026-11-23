-- Keep the legacy primary category and multi-category index in sync for new vendors.
create or replace function public.sync_vendor_primary_category_membership()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.category_id is not null then
    insert into public.vendor_category_memberships(vendor_id,category_id)
    values(new.id,new.category_id) on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists vendors_sync_primary_category_membership on public.vendors;
create trigger vendors_sync_primary_category_membership
after insert or update of category_id on public.vendors
for each row execute function public.sync_vendor_primary_category_membership();
-- Do not grant direct EXECUTE to API roles; invoked only by trigger.
revoke all on function public.sync_vendor_primary_category_membership() from public,anon,authenticated;
