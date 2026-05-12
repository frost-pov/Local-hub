-- ============================================================
-- RUN IN SUPABASE → SQL EDITOR: copy ALL of this file’s SQL and paste here.
-- Do NOT paste the path "supabase/migrations/005_backfill_profiles_fix_trigger.sql" — only the statements below.
-- Safe to run more than once.
-- ============================================================

-- 1) Backfill: one profiles row per auth user that’s missing it (phone left NULL avoids UNIQUE clashes)
INSERT INTO public.profiles (id, full_name, phone, role)
SELECT
  u.id,
  trim(coalesce(u.raw_user_meta_data->>'full_name', '')),
  NULL,
  'customer'::text
FROM auth.users AS u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 2) Safer signup trigger: blank phone → NULL; on phone duplicate retry with NULL phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  phone_candidate text := NULLIF(
    trim(coalesce(NEW.phone::text, NEW.raw_user_meta_data->>'phone', '')),
    ''
  );
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
      NEW.id,
      trim(coalesce(NEW.raw_user_meta_data->>'full_name', '')),
      phone_candidate,
      'customer'
    );
  EXCEPTION WHEN unique_violation THEN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
      NEW.id,
      trim(coalesce(NEW.raw_user_meta_data->>'full_name', '')),
      NULL,
      'customer'
    );
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
