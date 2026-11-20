-- Three distinct free photo placements without adding a second media table.
-- 0 = directory card, 1 = profile logo, 2 = profile banner.
-- Earlier single-photo listings already use sort_order = 0 and remain valid.
CREATE UNIQUE INDEX IF NOT EXISTS vendor_photos_free_slot_unique
  ON public.vendor_photos (vendor_id, sort_order)
  WHERE sort_order BETWEEN 0 AND 2;

CREATE OR REPLACE FUNCTION public.limit_free_vendor_photo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF current_user = 'authenticated' AND NOT public.is_admin() THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.vendor_id::text, 0));
    IF NEW.sort_order NOT BETWEEN 0 AND 2 THEN
      RAISE EXCEPTION 'Free listings include a directory image, business logo, and profile banner';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.vendor_photos p
      WHERE p.vendor_id = NEW.vendor_id AND p.sort_order = NEW.sort_order
    ) THEN
      RAISE EXCEPTION 'This photo placement already has an image';
    END IF;
    IF NEW.storage_path NOT LIKE NEW.vendor_id::text || '/%' THEN
      RAISE EXCEPTION 'Photo must be stored under its listing folder';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
