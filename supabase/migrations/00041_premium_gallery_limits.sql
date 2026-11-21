-- PR #38: all owner photo mutations pass through the authenticated server API.
-- Stops clients from bypassing Free/Premium photo limits by using Supabase directly.
drop policy if exists "Verified owners can add a listing photo" on public.vendor_photos;
drop policy if exists "Verified owners can remove their listing photo" on public.vendor_photos;
drop policy if exists "Verified owners can upload listing images" on storage.objects;
drop policy if exists "Verified owners can delete listing images" on storage.objects;

-- One directory cover (0), one logo (1), one banner (2), and up to 15
-- premium portfolio entries (3..17), even under simultaneous requests.
create unique index if not exists unique_vendor_photo_placement
  on public.vendor_photos(vendor_id,sort_order);
alter table public.vendor_photos
  add constraint vendor_photo_valid_slot check (sort_order between 0 and 17);
