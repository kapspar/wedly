-- Stripe webhooks verify ownership using the server-side service-role client.
-- Existing vendors table privilege policy had omitted SELECT for service_role.
-- The role remains read-only on vendors; browser roles are unchanged.
grant select on table public.vendors to service_role;
