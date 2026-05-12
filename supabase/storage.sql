-- ============================================================
-- Supabase Storage buckets + policies (run after schema + RLS)
-- Replace bucket names if you change them in the app.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('vendor-media', 'vendor-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read for storefront images
drop policy if exists "Public read vendor-media" on storage.objects;
create policy "Public read vendor-media"
on storage.objects for select
using (bucket_id = 'vendor-media');

drop policy if exists "Public read product-images" on storage.objects;
create policy "Public read product-images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Authenticated uploads: folder prefix = user id (simple ownership)
drop policy if exists "Users upload vendor-media" on storage.objects;
create policy "Users upload vendor-media"
on storage.objects for insert
with check (
  bucket_id = 'vendor-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own vendor-media" on storage.objects;
create policy "Users update own vendor-media"
on storage.objects for update
using (
  bucket_id = 'vendor-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users upload product-images" on storage.objects;
create policy "Users upload product-images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own product-images" on storage.objects;
create policy "Users update own product-images"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
