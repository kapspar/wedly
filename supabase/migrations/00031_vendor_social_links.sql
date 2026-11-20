-- Optional vendor social and messaging links on verified listings and new-business submissions.
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS pinterest_url text,
  ADD COLUMN IF NOT EXISTS snapchat_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_url text;

ALTER TABLE public.vendor_listing_requests
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS pinterest_url text,
  ADD COLUMN IF NOT EXISTS snapchat_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_url text;

ALTER TABLE public.vendor_listing_requests
  ADD CONSTRAINT vendor_listing_requests_social_links_https CHECK (
    (tiktok_url IS NULL OR (length(tiktok_url) <= 500 AND tiktok_url ~* '^https://'))
    AND (facebook_url IS NULL OR (length(facebook_url) <= 500 AND facebook_url ~* '^https://'))
    AND (youtube_url IS NULL OR (length(youtube_url) <= 500 AND youtube_url ~* '^https://'))
    AND (pinterest_url IS NULL OR (length(pinterest_url) <= 500 AND pinterest_url ~* '^https://'))
    AND (snapchat_url IS NULL OR (length(snapchat_url) <= 500 AND snapchat_url ~* '^https://'))
    AND (linkedin_url IS NULL OR (length(linkedin_url) <= 500 AND linkedin_url ~* '^https://'))
    AND (whatsapp_url IS NULL OR (length(whatsapp_url) <= 500 AND whatsapp_url ~* '^https://'))
  );

-- Existing vendor edit permissions and ownership guards continue to apply.
-- Preserve all seven social fields when admin approves a new vendor submission.
CREATE OR REPLACE FUNCTION public.review_vendor_listing_request(
  p_request_id uuid, p_decision text, p_note text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
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
      trim(both '-' from regexp_replace(lower(trim(request_row.name)), '[^a-z0-9]+', '-', 'g')), 60
    );
    IF candidate_slug = '' THEN candidate_slug := 'business'; END IF;
    candidate_slug := candidate_slug || '-' || substr(replace(request_row.id::text, '-', ''), 1, 12);
    INSERT INTO public.vendors (
      claimed_by, category_id, name, slug, description, city, area,
      email, phone, website_url, instagram_url, pricing_range,
      tiktok_url, facebook_url, youtube_url, pinterest_url, snapchat_url, linkedin_url, whatsapp_url,
      is_claimed, is_published, is_featured
    ) VALUES (
      request_row.requester_id, request_row.category_id, trim(request_row.name), candidate_slug,
      nullif(trim(request_row.description),''), trim(request_row.city), nullif(trim(request_row.area),''),
      trim(request_row.business_email), nullif(trim(request_row.phone),''),
      nullif(trim(request_row.website_url),''), nullif(trim(request_row.instagram_url),''),
      nullif(trim(request_row.pricing_range),''),
      nullif(trim(request_row.tiktok_url),''), nullif(trim(request_row.facebook_url),''), nullif(trim(request_row.youtube_url),''), nullif(trim(request_row.pinterest_url),''), nullif(trim(request_row.snapchat_url),''), nullif(trim(request_row.linkedin_url),''), nullif(trim(request_row.whatsapp_url),''),
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
