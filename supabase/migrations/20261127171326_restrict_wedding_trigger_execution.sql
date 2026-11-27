-- This function is called by the existing wedding INSERT trigger only.
revoke execute on function public.add_wedding_owner() from public, anon, authenticated;
