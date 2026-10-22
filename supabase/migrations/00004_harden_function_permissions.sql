-- Limit public execution of privileged helper functions.
-- is_admin is evaluated by RLS policies for signed-in users.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Ensure trigger helper resolves names against a fixed trusted search path.
ALTER FUNCTION public.update_updated_at() SET search_path = pg_catalog;
