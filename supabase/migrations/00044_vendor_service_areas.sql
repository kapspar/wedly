-- Service area is independent of business locality.
-- Existing vendors have unknown coverage until their owner specifies it.
alter table public.vendors add column if not exists service_areas text[] not null default '{}'::text[];
alter table public.vendors add constraint vendor_service_areas_limit check (
 cardinality(service_areas) <= 20
 and array_position(service_areas,null) is null

);
create index if not exists vendors_service_areas_gin on public.vendors using gin(service_areas);
