-- Migration: Fix handle_new_user trigger to include email column
-- Date: 2026-02-21
-- Purpose: Fixes "database error trying to create new account" on signup.
--          The profiles table has an email column (added in migration 20260218000001)
--          but the handle_new_user() function was not updated to populate it.
--          Also adds ON CONFLICT DO NOTHING for safety.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $func$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW."id",
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW."email"
  )
  ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (drop first to ensure clean state)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
