-- Vendor account intent is non-privileged; business ownership is assigned separately by admin review.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    CASE WHEN new.raw_user_meta_data ->> 'account_type' = 'vendor'
      THEN 'vendor'::public.user_role ELSE 'couple'::public.user_role END
  );
  RETURN new;
END;
$$;

-- Users may change their own contact details but cannot grant themselves the admin role.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND current_user = 'authenticated' THEN
    RAISE EXCEPTION 'Account roles cannot be changed directly';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS prevent_profile_role_self_update ON public.profiles;
CREATE TRIGGER prevent_profile_role_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_self_update();

-- Google OAuth cannot include signup metadata. Only a deliberate vendor signup/login
-- can call this RPC. It never grants admin access or listing ownership.
CREATE OR REPLACE FUNCTION public.register_vendor_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  current_role public.user_role;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN false;
  END IF;
  SELECT role INTO current_role FROM public.profiles
    WHERE id = (SELECT auth.uid()) FOR UPDATE;
  IF current_role = 'vendor' THEN
    RETURN true;
  END IF;
  IF current_role IS DISTINCT FROM 'couple'::public.user_role
     OR EXISTS (SELECT 1 FROM public.weddings WHERE couple_id = (SELECT auth.uid())) THEN
    RETURN false;
  END IF;
  UPDATE public.profiles SET role = 'vendor'
  WHERE id = (SELECT auth.uid());
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.register_vendor_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_vendor_account() TO authenticated;
REVOKE ALL ON FUNCTION public.prevent_profile_role_self_update() FROM PUBLIC, anon, authenticated;
