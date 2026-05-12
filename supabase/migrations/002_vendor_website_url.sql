-- Run once if you created the DB from schema.sql before `website_url` existed.
alter table public.vendors add column if not exists website_url text;
comment on column public.vendors.website_url is
  'Optional vendor-owned URL. Shown as “Their website”; orders still checkout on Local Hub.';
