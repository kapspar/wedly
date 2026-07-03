-- Fix infinite recursion in RLS policies
--
-- Root cause: "Admins can view all profiles" queries the profiles table from
-- within a policy ON profiles, causing PostgreSQL to recurse infinitely.
-- This cascades to any table whose admin policy also references profiles.
--
-- Fix: create a SECURITY DEFINER function that bypasses RLS when checking
-- admin status, then replace all recursive policy sub-queries with it.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles: replace recursive admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Vendors: replace inline sub-query with function
DROP POLICY IF EXISTS "Admins can manage all vendors" ON public.vendors;
CREATE POLICY "Admins can manage all vendors" ON public.vendors
  FOR ALL USING (public.is_admin());

-- Vendor categories: replace inline sub-query with function
DROP POLICY IF EXISTS "Admins can manage vendor categories" ON public.vendor_categories;
CREATE POLICY "Admins can manage vendor categories" ON public.vendor_categories
  FOR ALL USING (public.is_admin());

-- Vendor photos: replace inline sub-query with function
DROP POLICY IF EXISTS "Admins can manage vendor photos" ON public.vendor_photos;
CREATE POLICY "Admins can manage vendor photos" ON public.vendor_photos
  FOR ALL USING (public.is_admin());

-- Inquiries: replace inline sub-queries with function
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.inquiries;
CREATE POLICY "Admins can view all inquiries" ON public.inquiries
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update inquiries" ON public.inquiries;
CREATE POLICY "Admins can update inquiries" ON public.inquiries
  FOR UPDATE USING (public.is_admin());

-- Weddings: replace inline sub-query with function
DROP POLICY IF EXISTS "Admins can view all weddings" ON public.weddings;
CREATE POLICY "Admins can view all weddings" ON public.weddings
  FOR SELECT USING (public.is_admin());
