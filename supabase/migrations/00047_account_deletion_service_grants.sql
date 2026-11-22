-- Additional service-role permissions needed by account deletion.
-- Access is granted only to the backend service role (never anon/authenticated).
grant select on public.admin_access to service_role;
grant select,update on public.vendors to service_role;
grant select,delete on public.vendor_photos to service_role;
grant select,update on public.vendor_claims to service_role;
grant select,update on public.vendor_listing_requests to service_role;
