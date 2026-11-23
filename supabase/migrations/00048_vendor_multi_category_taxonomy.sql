-- Additive vendor taxonomy: existing category_id remains the primary category.
-- This migration deliberately does not reclassify or publish existing listings.
create table if not exists public.vendor_category_memberships (
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  category_id uuid not null references public.vendor_categories(id) on delete cascade,
  primary key (vendor_id, category_id)
);
create index if not exists vendor_category_memberships_category_idx on public.vendor_category_memberships(category_id);
insert into public.vendor_category_memberships(vendor_id, category_id)
select id, category_id from public.vendors where category_id is not null
on conflict do nothing;

create table if not exists public.vendor_services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.vendor_categories(id) on delete cascade,
  name text not null,
  slug text not null,
  display_order integer not null default 0,
  unique(category_id, slug),
  unique(id, category_id)
);
create table if not exists public.vendor_service_memberships (
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  service_id uuid not null references public.vendor_services(id) on delete cascade,
  primary key(vendor_id, service_id)
);
create index if not exists vendor_service_memberships_service_idx on public.vendor_service_memberships(service_id);

insert into public.vendor_categories(name,slug,display_order,icon,description)
values ('Clothing & Fashion','clothing-fashion',13,'shirt','Sarees, lehengas, bridal and groom wear, tailoring and alterations'),
       ('Photography & Media','photography-media',14,'camera','Photography, videography and social-first wedding content')
on conflict (slug) do nothing;

insert into public.vendor_services(category_id,name,slug,display_order)
select c.id, s.name, s.slug, s.ord from public.vendor_categories c
join (values
('clothing-fashion','Sarees','sarees',1),
('clothing-fashion','Lehengas','lehengas',2),
('clothing-fashion','Bridal Wear','bridal-wear',3),
('clothing-fashion','Groom Wear','groom-wear',4),
('clothing-fashion','Tailoring & Alterations','tailoring-alterations',5),
('makeup-artists','Bridal Makeup','bridal-makeup',1),
('makeup-artists','Hair Styling','hair-styling',2),
('makeup-artists','Saree Draping & Pleating','saree-draping-pleating',3),
('makeup-artists','Mehndi & Henna','mehndi-henna',4),
('photography-media','Photography','photography',1),
('photography-media','Videography','videography',2),
('photography-media','Wedding Content Creation','wedding-content-creation',3)
) as s(category_slug,name,slug,ord) on c.slug=s.category_slug
on conflict (category_id,slug) do nothing;

alter table public.vendor_category_memberships enable row level security;
alter table public.vendor_services enable row level security;
alter table public.vendor_service_memberships enable row level security;

create policy "Public reads vendor categories" on public.vendor_category_memberships for select to anon,authenticated using (
  exists(select 1 from public.vendors v where v.id=vendor_id and v.is_published=true)
  or exists(select 1 from public.vendors v where v.id=vendor_id and v.claimed_by=(select auth.uid()))
);
create policy "Vendor edits own category memberships" on public.vendor_category_memberships for insert to authenticated with check (
  exists(select 1 from public.vendors v where v.id=vendor_id and v.claimed_by=(select auth.uid()) and v.is_claimed=true)
);
create policy "Vendor removes own category memberships" on public.vendor_category_memberships for delete to authenticated using (
  exists(select 1 from public.vendors v where v.id=vendor_id and v.claimed_by=(select auth.uid()) and v.is_claimed=true)
);
create policy "Everyone reads service taxonomy" on public.vendor_services for select to anon,authenticated using(true);
create policy "Public reads vendor services" on public.vendor_service_memberships for select to anon,authenticated using (
  exists(select 1 from public.vendors v where v.id=vendor_id and v.is_published=true)
  or exists(select 1 from public.vendors v where v.id=vendor_id and v.claimed_by=(select auth.uid()))
);
create policy "Vendor edits own services" on public.vendor_service_memberships for insert to authenticated with check (
  exists(select 1 from public.vendors v where v.id=vendor_id and v.claimed_by=(select auth.uid()) and v.is_claimed=true)
);
create policy "Vendor removes own services" on public.vendor_service_memberships for delete to authenticated using (
  exists(select 1 from public.vendors v where v.id=vendor_id and v.claimed_by=(select auth.uid()) and v.is_claimed=true)
);
grant select on public.vendor_services to anon,authenticated;
grant select,insert,delete on public.vendor_category_memberships,public.vendor_service_memberships to authenticated;
grant select on public.vendor_category_memberships,public.vendor_service_memberships to anon;
