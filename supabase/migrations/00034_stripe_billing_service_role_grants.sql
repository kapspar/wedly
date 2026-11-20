-- Fix PR #28: new billing tables require explicit privileges for the
-- Supabase service_role. Row-level security remains enabled; public and
-- authenticated clients still cannot modify server-owned billing state.
grant select, insert, update, delete on table public.vendor_subscriptions to service_role;
grant select, insert, update, delete on table public.stripe_webhook_events to service_role;
