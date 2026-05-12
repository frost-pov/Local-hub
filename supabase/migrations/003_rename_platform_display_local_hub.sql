-- If an older seed used platform_name = 'Soko', align UI copy with Local Hub.
update public.platform_settings
set value = 'Local Hub', updated_at = now()
where key = 'platform_name' and value = 'Soko';
