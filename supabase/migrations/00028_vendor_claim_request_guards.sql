-- Limit vendor-claim submissions to vendor accounts for unclaimed listings.
-- Existing requesters can read only their claims via the established RLS policy.
DROP POLICY IF EXISTS "Signed in users request their own claim" ON public.vendor_claims;
CREATE POLICY "Vendor accounts can request an unclaimed listing"
ON public.vendor_claims FOR INSERT TO authenticated
WITH CHECK (
  requester_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'vendor'
  )
  AND EXISTS (
    SELECT 1 FROM public.vendors AS v
    WHERE v.id = vendor_id AND v.is_published = true
      AND v.is_claimed = false AND v.claimed_by IS NULL
  )
  AND status = 'pending'
  AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_note IS NULL
  AND length(trim(explanation)) BETWEEN 20 AND 3000
  AND length(trim(business_email)) BETWEEN 5 AND 254
  AND (evidence_url IS NULL OR evidence_url ~ '^https://')
);

CREATE UNIQUE INDEX IF NOT EXISTS vendor_claims_one_open_request_per_user_listing
ON public.vendor_claims (vendor_id, requester_id)
WHERE status IN ('pending', 'more_info');
