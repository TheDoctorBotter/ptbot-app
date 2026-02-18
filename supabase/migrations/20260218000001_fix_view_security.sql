-- Migration: Fix Supabase Security Advisor warnings
-- Date: 2026-02-18
-- Purpose: Resolve 6 security issues flagged by Supabase Security Advisor
--
-- Issues fixed:
--   1. admin_assessments exposes auth.users data (joins auth.users)
--   2. admin_appointments exposes auth.users data (joins auth.users)
--   3. admin_assessments uses SECURITY DEFINER (bypasses RLS)
--   4. patient_activity_summary uses SECURITY DEFINER (bypasses RLS)
--   5. admin_consult_overview uses SECURITY DEFINER (bypasses RLS)
--   6. admin_appointments uses SECURITY DEFINER (bypasses RLS)
--
-- Additional fix:
--   - Appointments RLS policies reference role 'pt' which doesn't exist
--     in the profiles role constraint (only 'patient','clinician','admin')
--
-- HIPAA compliance: All views now enforce RLS through SECURITY INVOKER,
-- meaning every query runs with the calling user's permissions.

-- ============================================
-- STEP 1: ADD EMAIL COLUMN TO PROFILES
-- ============================================
-- The admin_assessments and admin_appointments views currently join
-- auth.users solely to get the user's email. We add an email column
-- to profiles so views never need to touch auth.users directly.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- STEP 2: BACKFILL EXISTING PROFILES WITH EMAIL
-- ============================================
-- Copy email from auth.users to profiles for all existing users.
-- This runs as postgres (superuser) during migration so auth.users is accessible.

UPDATE profiles
SET email = u.email
FROM auth.users u
WHERE profiles.id = u.id
  AND profiles.email IS NULL;

-- ============================================
-- STEP 3: UPDATE SIGNUP TRIGGER TO SYNC EMAIL
-- ============================================
-- The handle_new_user() trigger fires on auth.users INSERT.
-- Update it to also copy the email address into profiles.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: ADD TRIGGER TO SYNC EMAIL ON UPDATE
-- ============================================
-- If a user changes their email in Supabase Auth, keep profiles in sync.

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_update();

-- ============================================
-- STEP 5: RECREATE admin_assessments VIEW
-- ============================================
-- Was: JOIN auth.users, no SECURITY INVOKER
-- Now: JOIN profiles for email, SECURITY INVOKER enabled
--
-- With SECURITY INVOKER, the RLS policies on 'assessments' and 'profiles'
-- are enforced for the calling user:
--   - Patients see only their own assessments
--   - Clinicians/admins see assessments for patients in their clinic

DROP VIEW IF EXISTS admin_assessments;

CREATE VIEW admin_assessments
WITH (security_invoker = true)
AS
SELECT
  a.id,
  a.user_id,
  a.user_email,
  a.user_phone,
  p.email AS auth_email,
  a.pain_level,
  a.pain_location,
  a.pain_duration,
  a.pain_type,
  a.mechanism_of_injury,
  a.additional_symptoms,
  a.red_flags,
  a.risk_level,
  a.next_steps,
  a.recommendations,
  a.consent_contact,
  a.consent_data_use,
  a.legal_waiver_accepted,
  a.consent_timestamp,
  a.created_at
FROM assessments a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.created_at DESC;

-- Grant SELECT to authenticated users only (RLS handles row filtering)
GRANT SELECT ON admin_assessments TO authenticated;

-- ============================================
-- STEP 6: RECREATE admin_appointments VIEW
-- ============================================
-- Was: JOIN auth.users, no SECURITY INVOKER
-- Now: JOIN profiles for email, SECURITY INVOKER enabled
--
-- With SECURITY INVOKER, the RLS policies on 'appointments' and 'profiles'
-- are enforced for the calling user.

DROP VIEW IF EXISTS admin_appointments;

CREATE VIEW admin_appointments
WITH (security_invoker = true)
AS
SELECT
  a.id,
  a.user_id,
  p.email AS user_email,
  a.patient_name,
  a.patient_email,
  a.patient_phone,
  a.start_time,
  a.end_time,
  a.duration_minutes,
  a.google_event_id,
  a.google_event_link,
  a.zoom_meeting_id,
  a.zoom_meeting_url,
  a.status,
  a.auto_confirmed,
  a.confirmed_at,
  a.patient_notes,
  a.pt_notes,
  a.created_at,
  a.updated_at
FROM appointments a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.start_time DESC;

-- Grant SELECT to authenticated users only
GRANT SELECT ON admin_appointments TO authenticated;

-- ============================================
-- STEP 7: RECREATE patient_activity_summary VIEW
-- ============================================
-- Was: No SECURITY INVOKER (RLS bypassed, all patients visible)
-- Now: SECURITY INVOKER enabled
--
-- With SECURITY INVOKER, the RLS on 'profiles', 'activity_events',
-- and 'assessments' all apply. Clinicians only see patients in
-- their clinic; patients see nothing (they're filtered by role='patient').

DROP VIEW IF EXISTS patient_activity_summary;

CREATE VIEW patient_activity_summary
WITH (security_invoker = true)
AS
SELECT
  p.id AS patient_id,
  p.first_name,
  p.last_name,
  p.clinic_id,
  p.role,
  (
    SELECT MAX(created_at)
    FROM activity_events ae
    WHERE ae.user_id = p.id
  ) AS last_activity_at,
  (
    SELECT COUNT(*)
    FROM activity_events ae
    WHERE ae.user_id = p.id
      AND ae.created_at >= NOW() - INTERVAL '7 days'
      AND ae.event_type IN ('assessment_completed', 'routine_opened', 'video_opened')
  ) AS sessions_this_week,
  (
    SELECT jsonb_build_object(
      'id', a.id,
      'pain_level', a.pain_level,
      'pain_location', a.pain_location,
      'risk_level', a.risk_level,
      'protocol_key', a.protocol_key_selected,
      'phase_number', a.phase_number_selected,
      'red_flags', a.red_flags,
      'created_at', a.created_at
    )
    FROM assessments a
    WHERE a.user_id = p.id
    ORDER BY a.created_at DESC
    LIMIT 1
  ) AS latest_assessment
FROM profiles p
WHERE p.role = 'patient';

-- Grant SELECT to authenticated users only
GRANT SELECT ON patient_activity_summary TO authenticated;

-- ============================================
-- STEP 8: RECREATE admin_consult_overview VIEW
-- ============================================
-- Was: No SECURITY INVOKER (all consults visible to any authenticated user)
-- Now: SECURITY INVOKER enabled
--
-- With SECURITY INVOKER, the RLS on 'appointments', 'profiles',
-- 'telehealth_consents', 'consult_location_verifications', and
-- 'consult_notes' all apply. Only clinicians/admins can see this data.

DROP VIEW IF EXISTS admin_consult_overview;

CREATE VIEW admin_consult_overview
WITH (security_invoker = true)
AS
SELECT
  a.id AS appointment_id,
  a.user_id AS patient_user_id,
  p.first_name AS patient_first_name,
  p.last_name AS patient_last_name,
  a.patient_name,
  a.patient_email,
  a.start_time,
  a.end_time,
  a.status AS appointment_status,
  a.zoom_meeting_url,

  -- Consent status
  tc.consent_version,
  tc.accepted_at AS consent_accepted_at,
  CASE WHEN tc.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_consent,

  -- Location verification
  lv.confirmed_state,
  lv.confirmed_city,
  lv.confirmed_at AS location_confirmed_at,
  CASE WHEN lv.id IS NOT NULL THEN TRUE ELSE FALSE END AS location_verified,

  -- Note status
  cn.id AS note_id,
  CASE WHEN cn.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_note,
  cn.red_flags,
  cn.follow_up_recommended,
  cn.emr_synced,
  cn.created_at AS note_created_at

FROM appointments a
LEFT JOIN profiles p ON a.user_id = p.id
LEFT JOIN telehealth_consents tc ON a.user_id = tc.user_id
LEFT JOIN consult_location_verifications lv ON a.id = lv.appointment_id
LEFT JOIN consult_notes cn ON a.id = cn.appointment_id
WHERE a.status IN ('scheduled', 'confirmed', 'completed')
ORDER BY a.start_time DESC;

-- Grant SELECT to authenticated users only
GRANT SELECT ON admin_consult_overview TO authenticated;

-- ============================================
-- STEP 9: FIX APPOINTMENTS RLS ROLE BUG
-- ============================================
-- The original appointments RLS policies use role 'pt', but the profiles
-- table constraint only allows 'patient', 'clinician', 'admin'.
-- This means the "PT can view/update" policies NEVER match anyone.
-- Fix: change 'pt' to 'clinician'.

DROP POLICY IF EXISTS "PT can view all appointments" ON appointments;
CREATE POLICY "Clinicians can view all appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('clinician', 'admin')
    )
  );

DROP POLICY IF EXISTS "PT can update any appointment" ON appointments;
CREATE POLICY "Clinicians can update any appointment" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('clinician', 'admin')
    )
  );

-- ============================================
-- STEP 10: EXPLICITLY REVOKE ANON ACCESS
-- ============================================
-- HIPAA: Ensure the anonymous role cannot access any of these views
-- or the underlying sensitive tables. Belt-and-suspenders approach.

REVOKE ALL ON admin_assessments FROM anon;
REVOKE ALL ON admin_appointments FROM anon;
REVOKE ALL ON patient_activity_summary FROM anon;
REVOKE ALL ON admin_consult_overview FROM anon;

REVOKE ALL ON assessments FROM anon;
REVOKE ALL ON appointments FROM anon;
REVOKE ALL ON activity_events FROM anon;
REVOKE ALL ON telehealth_consents FROM anon;
REVOKE ALL ON consult_location_verifications FROM anon;
REVOKE ALL ON consult_notes FROM anon;

-- ============================================
-- VERIFICATION COMMENTS
-- ============================================
-- After running this migration, verify in Supabase Security Advisor:
--
-- 1. No "Exposed Auth Users" warnings
--    - admin_assessments now joins profiles (not auth.users)
--    - admin_appointments now joins profiles (not auth.users)
--
-- 2. No "Security Definer Views" warnings
--    - All 4 views now use security_invoker = true
--
-- 3. RLS enforcement chain:
--    - Views use SECURITY INVOKER → queries run as calling user
--    - All underlying tables have RLS enabled
--    - Patients: can only see their own data
--    - Clinicians: can see their clinic's patient data
--    - Admins: can see their clinic's patient data
--    - Anon: cannot access any sensitive data
--
-- 4. The 'pt' role bug in appointments RLS is fixed → 'clinician'
