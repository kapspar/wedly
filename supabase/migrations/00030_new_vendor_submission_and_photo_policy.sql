-- Repair prior storage permissions: unqualified name in subquery resolved to
-- vendors.name rather than storage.objects.name, rejecting legitimate photo uploads.
DROP POLICY IF EXISTS "Verified owners can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Verified owners can delete listing images" ON storage.objects;

CREATE POLICY "Verified owners can upload listing images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vendor-photos'
  AND EXISTS (
    SELECT 1 FROM public.vendors AS v
    WHERE v.id::text = split_part(storage.objects.name, '/', 1)
      AND v.claimed_by = (SELECT auth.uid()) AND v.is_claimed = true
  )
);

CREATE POLICY "Verified owners can delete listing images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vendor-photos'
  AND EXISTS (
    SELECT 1 FROM public.vendors AS v
    WHERE v.id::text = split_part(storage.objects.name, '/', 1)
      AND v.claimed_by = (SELECT auth.uid()) AND v.is_claimed = true
  )
);

-- New businesses are queued for review, never publicly published on submission.
CREATE TABLE public.vendor_listing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.vendor_categories(id),
  name text NOT NULL,
  city text NOT NULL,
  area text,
  description text,
  business_email text NOT NULL,
  phone text,
  website_url text,
  instagram_url text,
  pricing_range text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  resulting_vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vendor_listing_request_name_length CHECK (length(trim(name)) BETWEEN 2 AND 180),
  CONSTRAINT vendor_listing_request_city_length CHECK (length(trim(city)) BETWEEN 2 AND 120),
  CONSTRAINT vendor_listing_request_email_length CHECK (length(trim(business_email)) BETWEEN 5 AND 254),
  CONSTRAINT vendor_listing_request_description_length CHECK (description IS NULL OR length(description) <= 5000),
  CONSTRAINT vendor_listing_request_url_scheme CHECK (
    (website_url IS NULL OR website_url ~ '^https://')
    AND (instagram_url IS NULL OR instagram_url ~ '^https://')
  )
);

CREATE INDEX vendor_listing_requests_requester ON public.vendor_listing_requests(requester_id, created_at DESC);
CREATE INDEX vendor_listing_requests_pending ON public.vendor_listing_requests(created_at DESC) WHERE status = 'pending';
CREATE UNIQUE INDEX vendor_listing_requests_one_pending_business ON public.vendor_listing_requests(requester_id, lower(trim(name)), lower(trim(city))) WHERE status = 'pending';

ALTER TABLE public.vendor_listing_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.vendor_listing_requests TO authenticated;

CREATE POLICY "Vendors may view own listing submissions"
ON public.vendor_listing_requests FOR SELECT TO authenticated
USING (requester_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "Vendor accounts may submit businesses for verification"
ON public.vendor_listing_requests FOR INSERT TO authenticated
WITH CHECK (
  requester_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'vendor'
  )
  AND status = 'pending'
  AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_note IS NULL
  AND resulting_vendor_id IS NULL
  AND length(trim(name)) BETWEEN 2 AND 180
  AND length(trim(city)) BETWEEN 2 AND 120
  AND length(trim(business_email)) BETWEEN 5 AND 254
);

-- Review is a privileged atomic transaction, guarded by admin_access.
CREATE OR REPLACE FUNCTION public.review_vendor_listing_request(
  p_request_id uuid,
  p_decision text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  request_row public.vendor_listing_requests%rowtype;
  created_vendor_id uuid;
  candidate_slug text;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.admin_access a
    WHERE a.user_id = (SELECT auth.uid()) AND a.role IN ('owner','business_admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;
  IF p_decision = 'rejected' AND nullif(trim(coalesce(p_note,'')), '') IS NULL THEN
    RAISE EXCEPTION 'A reason is required for rejection';
  END IF;

  SELECT * INTO request_row FROM public.vendor_listing_requests
  WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR request_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is no longer pending';
  END IF;

  IF p_decision = 'approved' THEN
    IF EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE lower(trim(v.name)) = lower(trim(request_row.name))
        AND lower(trim(v.city)) = lower(trim(request_row.city))
    ) THEN
      RAISE EXCEPTION 'A business with the same name and city already exists. Review duplicates before approving';
    END IF;

    candidate_slug := left(
      trim(both '-' from regexp_replace(lower(trim(request_row.name)), '[^a-z0-9]+', '-', 'g')),
      60
    );
    IF candidate_slug = '' THEN candidate_slug := 'business'; END IF;
    candidate_slug := candidate_slug || '-' || substr(replace(request_row.id::text, '-', ''), 1, 12);

    INSERT INTO public.vendors (
      claimed_by, category_id, name, slug, description, city, area,
      email, phone, website_url, instagram_url, pricing_range,
      is_claimed, is_published, is_featured
    ) VALUES (
      request_row.requester_id, request_row.category_id, trim(request_row.name), candidate_slug,
      nullif(trim(request_row.description),''), trim(request_row.city), nullif(trim(request_row.area),''),
      trim(request_row.business_email), nullif(trim(request_row.phone),''),
      nullif(trim(request_row.website_url),''), nullif(trim(request_row.instagram_url),''),
      nullif(trim(request_row.pricing_range),''),
      true, true, false
    ) RETURNING id INTO created_vendor_id;
  END IF;

  UPDATE public.vendor_listing_requests
  SET status = p_decision, review_note = nullif(trim(p_note),''),
      reviewed_by = (SELECT auth.uid()), reviewed_at = now(),
      resulting_vendor_id = created_vendor_id
  WHERE id = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.review_vendor_listing_request(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_vendor_listing_request(uuid,text,text) TO authenticated;
