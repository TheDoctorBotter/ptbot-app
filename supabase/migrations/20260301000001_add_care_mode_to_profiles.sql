-- Migration: Add care_mode column to profiles for pediatric/adult toggle
-- Date: 2026-03-01
-- Purpose: Allows users to switch between adult (orthopedic) and pediatric development modes

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS care_mode TEXT NOT NULL DEFAULT 'adult';

-- Add check constraint for valid values
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_care_mode_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_care_mode_check
  CHECK (care_mode IN ('adult', 'pediatric'));

-- Update handle_new_user to include care_mode default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $func$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, care_mode)
  VALUES (
    NEW."id",
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW."email",
    'adult'
  )
  ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
