-- Venues only appear as map pins when a genuine public street address and coordinates are available.
-- Existing addresses are intentionally null; do not infer a street address from city/area.
alter table public.vendors add column if not exists street_address text;
alter table public.vendors add column if not exists latitude double precision;
alter table public.vendors add column if not exists longitude double precision;
alter table public.vendors add constraint vendor_valid_latitude check(latitude is null or latitude between -90 and 90);
alter table public.vendors add constraint vendor_valid_longitude check(longitude is null or longitude between -180 and 180);
