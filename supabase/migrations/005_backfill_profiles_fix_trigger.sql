-- Fix missing profiles (auth user exists but public.profiles row does not)
-- Safe to run multiple times.

-- ------------------------------------------------------------
-- 1) Backfill one row per auth user with no profile (phone omitted to avoid UNIQUE collisions)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 2) Trigger: normalize empty phone to NULL so UNIQUE (phone) does not reject many signups + retry if phone collides
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  phone_candidate text := NULLIF(
    trim(coalesce(new.phone::text, new.raw_user_meta_data->>'phone', '')),
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
