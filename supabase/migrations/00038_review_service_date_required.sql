-- PR #34: require a service date for all reviews so claims about pricing
-- and the vendor's work can be evaluated in their proper historical context.
-- Confirmed the existing review data contains no NULL service dates.
alter table public.reviews alter column service_date set not null;
