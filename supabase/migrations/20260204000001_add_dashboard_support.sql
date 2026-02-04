-- Migration: Add dashboard support (roles, clinics, activity tracking)
-- Date: 2026-02-04
-- Purpose: Support role-based dashboards for patients and clinicians

-- ============================================
-- PART 1: ADD ROLE AND CLINIC TO PROFILES
-- ============================================

-- Add role column to profiles (patient, clinician, admin)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'patient';

-- Add clinic_id to profiles for clinic membership
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_id UUID;

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create index for clinic membership queries
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON profiles(clinic_id);

-- Add constraint for valid roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('patient', 'clinician', 'admin'));
  END IF;
END $$;

-- ============================================
-- PART 2: CREATE CLINICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for clinic name searches
CREATE INDEX IF NOT EXISTS idx_clinics_name ON clinics(name);

-- Enable RLS on clinics
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Clinicians and admins can view their own clinic
DROP POLICY IF EXISTS "Users can view own clinic" ON clinics;
CREATE POLICY "Users can view own clinic" ON clinics
  FOR SELECT USING (
    id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can update their clinic
DROP POLICY IF EXISTS "Admins can update own clinic" ON clinics;
CREATE POLICY "Admins can update own clinic" ON clinics
  FOR UPDATE USING (
    id IN (
      SELECT clinic_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add foreign key constraint from profiles to clinics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_clinic_id_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_clinic_id_fkey
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- PART 3: CREATE ACTIVITY_EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_ref_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint for valid event types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_events_type_check'
  ) THEN
    ALTER TABLE activity_events ADD CONSTRAINT activity_events_type_check
      CHECK (event_type IN (
        'assessment_completed',
        'assessment_started',
        'routine_opened',
        'video_opened',
        'video_completed',
        'phase_changed',
        'exercise_favorited',
        'session_started'
      ));
  END IF;
END $$;

-- Create indexes for activity queries
CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_user_created ON activity_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_type ON activity_events(event_type);

-- Enable RLS on activity_events
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
DROP POLICY IF EXISTS "Users can view own activity" ON activity_events;
CREATE POLICY "Users can view own activity" ON activity_events
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own activity
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_events;
CREATE POLICY "Users can insert own activity" ON activity_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Clinicians can view activity for patients in their clinic
DROP POLICY IF EXISTS "Clinicians can view clinic patient activity" ON activity_events;
CREATE POLICY "Clinicians can view clinic patient activity" ON activity_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles clinician
      WHERE clinician.id = auth.uid()
        AND clinician.role IN ('clinician', 'admin')
        AND clinician.clinic_id IS NOT NULL
        AND clinician.clinic_id = (
          SELECT clinic_id FROM profiles WHERE id = activity_events.user_id
        )
    )
  );

-- ============================================
-- PART 4: UPDATE PROFILES RLS FOR CLINIC ACCESS
-- ============================================

-- Clinicians can view patients in their clinic
DROP POLICY IF EXISTS "Clinicians can view clinic patients" ON profiles;
CREATE POLICY "Clinicians can view clinic patients" ON profiles
  FOR SELECT USING (
    -- Users can always view their own profile
    auth.uid() = id
    OR
    -- Clinicians/admins can view patients in their clinic
    EXISTS (
      SELECT 1 FROM profiles clinician
      WHERE clinician.id = auth.uid()
        AND clinician.role IN ('clinician', 'admin')
        AND clinician.clinic_id IS NOT NULL
        AND clinician.clinic_id = profiles.clinic_id
    )
  );

-- ============================================
-- PART 5: UPDATE ASSESSMENTS RLS FOR CLINIC ACCESS
-- ============================================

-- Clinicians can view assessments for patients in their clinic
DROP POLICY IF EXISTS "Clinicians can view clinic patient assessments" ON assessments;
CREATE POLICY "Clinicians can view clinic patient assessments" ON assessments
  FOR SELECT USING (
    -- Users can view their own assessments
    auth.uid() = user_id
    OR
    -- Clinicians/admins can view assessments for clinic patients
    EXISTS (
      SELECT 1 FROM profiles clinician
      WHERE clinician.id = auth.uid()
        AND clinician.role IN ('clinician', 'admin')
        AND clinician.clinic_id IS NOT NULL
        AND clinician.clinic_id = (
          SELECT clinic_id FROM profiles WHERE id = assessments.user_id
        )
    )
  );

-- ============================================
-- PART 6: CREATE HELPER VIEWS FOR DASHBOARD
-- ============================================

-- View for patient activity summary (for clinic dashboard)
CREATE OR REPLACE VIEW patient_activity_summary AS
SELECT
  p.id as patient_id,
  p.first_name,
  p.last_name,
  p.clinic_id,
  p.role,
  -- Last activity
  (
    SELECT MAX(created_at)
    FROM activity_events ae
    WHERE ae.user_id = p.id
  ) as last_activity_at,
  -- Sessions this week
  (
    SELECT COUNT(*)
    FROM activity_events ae
    WHERE ae.user_id = p.id
      AND ae.created_at >= NOW() - INTERVAL '7 days'
      AND ae.event_type IN ('assessment_completed', 'routine_opened', 'video_opened')
  ) as sessions_this_week,
  -- Latest assessment info
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
  ) as latest_assessment
FROM profiles p
WHERE p.role = 'patient';

-- Grant access to the view
GRANT SELECT ON patient_activity_summary TO authenticated;

-- ============================================
-- PART 7: UPDATE TRIGGER FOR PROFILES UPDATED_AT
-- ============================================

-- Make sure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for clinics updated_at
DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 8: SEED DEFAULT CLINIC (for testing)
-- ============================================

-- Insert a default clinic for testing (if none exists)
INSERT INTO clinics (id, name, address, email)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Demo Physical Therapy Clinic',
  '123 Rehab Street, Health City, HC 12345',
  'demo@ptclinic.com'
WHERE NOT EXISTS (
  SELECT 1 FROM clinics WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
);

COMMENT ON TABLE clinics IS 'Clinic organizations that can have multiple clinicians and patients';
COMMENT ON TABLE activity_events IS 'Tracks user engagement events for dashboard metrics';
COMMENT ON COLUMN profiles.role IS 'User role: patient, clinician, or admin';
COMMENT ON COLUMN profiles.clinic_id IS 'Optional clinic membership for clinic-based access control';
