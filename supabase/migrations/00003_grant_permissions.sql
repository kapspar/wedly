-- Grant table-level privileges to Supabase roles
--
-- RLS policies control row-level access, but PostgreSQL also requires
-- table-level GRANT before a role can query at all. The initial migration
-- created tables without any GRANT statements; this migration adds them.
--
-- anon: unauthenticated visitors — may only read public catalogue data
-- authenticated: logged-in users — may read/write their own data (RLS enforces ownership)

-- Public catalogue — readable by everyone
GRANT SELECT ON public.vendor_categories TO anon, authenticated;
GRANT SELECT ON public.vendors TO anon, authenticated;
GRANT SELECT ON public.vendor_photos TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;

-- User-owned data — only authenticated users; RLS restricts to own rows
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weddings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_categories TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_vendors TO authenticated;
GRANT SELECT, INSERT ON public.inquiries TO authenticated;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_list TO authenticated;
