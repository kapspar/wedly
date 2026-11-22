-- Self-service account deletion preparation. The GoTrue admin deleteUser API
-- remains responsible for removing auth.users; this function only removes
-- references that would otherwise block it, and releases claimed listings.
-- SECURITY INVOKER + service_role-only EXECUTE avoids a public definer API.
create or replace function public.prepare_account_deletion(p_user_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_user_id is null then raise exception 'Missing user'; end if;
  if exists(select 1 from public.admin_access where user_id=p_user_id) then
    raise exception 'Staff accounts cannot self-delete';
  end if;

  -- Subscription cancellation is performed and checked in the server route
  -- before this transaction. Clear remaining owner references.
  delete from public.vendor_subscriptions where owner_id=p_user_id;
  delete from public.vendor_checkout_reservations where owner_id=p_user_id;
  delete from public.vendor_photos
    where vendor_id in (select id from public.vendors where claimed_by=p_user_id);
  delete from public.vendor_availability
    where updated_by=p_user_id
      or vendor_id in (select id from public.vendors where claimed_by=p_user_id);
  delete from public.vendor_premium_profiles where owner_id=p_user_id
    or vendor_id in (select id from public.vendors where claimed_by=p_user_id);
  delete from public.vendor_lead_pipeline where owner_id=p_user_id
    or vendor_id in (select id from public.vendors where claimed_by=p_user_id);

  update public.vendors set claimed_by=null, is_claimed=false
    where claimed_by=p_user_id;

  -- Preserve legitimate moderation outcomes and third-party reviews but
  -- anonymize the reviewer/admin actor reference.
  update public.reviews set moderated_by=null where moderated_by=p_user_id;
  update public.reviews set response_moderated_by=null where response_moderated_by=p_user_id;
  update public.review_reports set handled_by=null where handled_by=p_user_id;
  update public.vendor_claims set reviewed_by=null where reviewed_by=p_user_id;
  update public.vendor_listing_requests set reviewed_by=null where reviewed_by=p_user_id;

  return true;
end;
$$;

revoke all on function public.prepare_account_deletion(uuid) from public,anon,authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
