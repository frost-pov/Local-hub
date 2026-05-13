-- ============================================================
-- FIX: PostgREST / Supabase REST needs TABLE PRIVILEGES in addition to RLS.
-- Without GRANT SELECT ON public.profiles TO authenticated, logged-in reads
-- return 42501 permission denied — the app swallowed that as “no profile row”.
-- Run once in SQL Editor (safe to re-run).
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Every table API may touch — RLS still decides which ROWS each role sees.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO service_role;
