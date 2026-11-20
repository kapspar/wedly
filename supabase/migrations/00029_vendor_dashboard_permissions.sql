-- Vendor dashboard: allow approved owners to edit only their own listings.
-- Critical listing ownership, publishing, billing and promotion flags remain staff-controlled.

CREATE POLICY "Verified owners can view their listings"
  ON public.vendors FOR SELECT TO authenticated
  USING (claimed_by = (SELECT auth.uid()) AND is_claimed = true);

CREATE POLICY "Verified owners can edit their listings"
  ON public.vendors FOR UPDATE TO authenticated
  USING (claimed_by = (SELECT auth.uid()) AND is_claimed = true)
  WITH CHECK (claimed_by = (SELECT auth.uid()) AND is_claimed = true);

CREATE OR REPLACE FUNCTION public.prevent_vendor_privileged_edits()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF current_user = 'authenticated'
     AND NOT public.is_admin()
     AND (
       NEW.id IS DISTINCT FROM OLD.id
       OR NEW.claimed_by IS DISTINCT FROM OLD.claimed_by
       OR NEW.is_claimed IS DISTINCT FROM OLD.is_claimed
       OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
       OR NEW.is_published IS DISTINCT FROM OLD.is_published
       OR NEW.category_id IS DISTINCT FROM OLD.category_id
       OR NEW.slug IS DISTINCT FROM OLD.slug
       OR NEW.priority IS DISTINCT FROM OLD.priority
       OR NEW.source_url IS DISTINCT FROM OLD.source_url
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
     )
  THEN
    RAISE EXCEPTION 'Only PlanWedly staff can modify protected listing fields';
  END IF;

  IF current_user = 'authenticated' AND NOT public.is_admin() AND
     (length(trim(NEW.name)) = 0 OR length(trim(NEW.city)) = 0)
  THEN
    RAISE EXCEPTION 'Business name and city are required';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS prevent_vendor_privileged_edits ON public.vendors;
CREATE TRIGGER prevent_vendor_privileged_edits
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.prevent_vendor_privileged_edits();
REVOKE ALL ON FUNCTION public.prevent_vendor_privileged_edits() FROM PUBLIC, anon, authenticated;

GRANT UPDATE ON public.vendors TO authenticated;

-- First free listing photo. This limit is enforced by the database, not client UI.
CREATE POLICY "Verified owners can add a listing photo"
  ON public.vendor_photos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vendors v WHERE v.id = vendor_id
      AND v.claimed_by = (SELECT auth.uid()) AND v.is_claimed = true
  ));
CREATE POLICY "Verified owners can remove their listing photo"
  ON public.vendor_photos FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vendors v WHERE v.id = vendor_id
      AND v.claimed_by = (SELECT auth.uid()) AND v.is_claimed = true
  ));
GRANT INSERT, DELETE ON public.vendor_photos TO authenticated;

CREATE OR REPLACE FUNCTION public.limit_free_vendor_photo()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF current_user = 'authenticated' AND NOT public.is_admin() THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.vendor_id::text, 0));
    IF EXISTS (SELECT 1 FROM public.vendor_photos WHERE vendor_id = NEW.vendor_id) THEN
      RAISE EXCEPTION 'The free plan includes one listing photo';
    END IF;
    IF NEW.storage_path NOT LIKE NEW.vendor_id::text || '/%' THEN
      RAISE EXCEPTION 'Photo must be stored under its listing folder';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS limit_free_vendor_photo ON public.vendor_photos;
CREATE TRIGGER limit_free_vendor_photo
  BEFORE INSERT ON public.vendor_photos
  FOR EACH ROW EXECUTE FUNCTION public.limit_free_vendor_photo();
REVOKE ALL ON FUNCTION public.limit_free_vendor_photo() FROM PUBLIC, anon, authenticated;

-- Public images only; vendors may upload/delete files in their own verified listing folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vendor-photos', 'vendor-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Verified owners can upload listing images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-photos'
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id::text = (storage.foldername(name))[1]
        AND v.claimed_by = (SELECT auth.uid()) AND v.is_claimed = true
    )
  );
CREATE POLICY "Verified owners can delete listing images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'vendor-photos'
    AND EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id::text = (storage.foldername(name))[1]
        AND v.claimed_by = (SELECT auth.uid()) AND v.is_claimed = true
    )
  );
CREATE POLICY "Public can view vendor listing images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'vendor-photos');
