-- Temporary Google Places-sourced location coordinates must not be retained indefinitely.
-- Pin query also enforces expiry immediately, even if the cleanup job has not yet run.
alter table public.vendors add column if not exists coordinates_expires_at timestamptz;
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'planwedly-expire-venue-coordinate-cache',
  '15 * * * *',
  $job$update public.vendors
    set latitude = null, longitude = null, coordinates_expires_at = null
    where coordinates_expires_at is not null and coordinates_expires_at <= now();$job$
);
