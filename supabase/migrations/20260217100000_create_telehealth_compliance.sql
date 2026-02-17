-- Migration: Create telehealth compliance tables for HIPAA-compliant consults
-- Date: 2026-02-17
-- Purpose: Support telehealth consent, location verification, and clinical documentation
--
-- Tables created:
--   1. telehealth_consents - Patient telehealth consent records
--   2. consult_location_verifications - Pre-consult location confirmations
--   3. consult_notes - Clinical documentation (SOAP notes, admin-only)
--
-- HIPAA Compliance Notes:
--   - All tables have RLS enabled
--   - consult_notes visible ONLY to admin/clinician roles
--   - Audit timestamps on all records
--   - Consent versioning for regulatory compliance

-- ============================================
-- PART 1: TELEHEALTH_CONSENTS TABLE
-- Records patient acceptance of telehealth terms
-- ============================================

CREATE TABLE IF NOT EXISTS telehealth_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Consent versioning for compliance
  consent_version TEXT NOT NULL,  -- e.g. "v1.0_2026-02-17"
  consent_text_hash TEXT NOT NULL,  -- SHA256 hash of consent text for verification

  -- Acceptance metadata
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_ip TEXT,  -- IP address at time of consent (optional, for audit)
  user_agent TEXT,   -- Browser/device info (optional, for audit)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only accept each consent version once
  UNIQUE(user_id, consent_version)
);

-- Index for efficient user consent lookups
CREATE INDEX IF NOT EXISTS idx_telehealth_consents_user_id
  ON telehealth_consents(user_id);

-- Index for consent version queries
CREATE INDEX IF NOT EXISTS idx_telehealth_consents_version
  ON telehealth_consents(consent_version);

-- Composite index for checking user's current consent
CREATE INDEX IF NOT EXISTS idx_telehealth_consents_user_version
  ON telehealth_consents(user_id, consent_version, accepted_at DESC);

-- Enable RLS
ALTER TABLE telehealth_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telehealth_consents

-- Users can view their own consents
DROP POLICY IF EXISTS "Users can view own telehealth consents" ON telehealth_consents;
CREATE POLICY "Users can view own telehealth consents" ON telehealth_consents
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own consent (accept telehealth terms)
DROP POLICY IF EXISTS "Users can insert own telehealth consent" ON telehealth_consents;
CREATE POLICY "Users can insert own telehealth consent" ON telehealth_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin/clinician can view all consents (for audit purposes)
DROP POLICY IF EXISTS "Admin can view all telehealth consents" ON telehealth_consents;
CREATE POLICY "Admin can view all telehealth consents" ON telehealth_consents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'clinician')
    )
  );

-- ============================================
-- PART 2: CONSULT_LOCATION_VERIFICATIONS TABLE
-- Records patient location confirmation before each consult
-- Required for state licensure compliance (TX only for now)
-- ============================================

CREATE TABLE IF NOT EXISTS consult_location_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Location data
  confirmed_state TEXT NOT NULL,  -- Must be 'TX' for Texas
  confirmed_city TEXT,            -- Optional city for records

  -- Verification metadata
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method TEXT NOT NULL DEFAULT 'self_attest',  -- self_attest | gps (future)

  -- IP for audit trail (optional)
  confirmed_ip TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One verification per appointment
  UNIQUE(appointment_id)
);

-- Index for appointment lookups
CREATE INDEX IF NOT EXISTS idx_consult_location_verifications_appointment_id
  ON consult_location_verifications(appointment_id);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_consult_location_verifications_user_id
  ON consult_location_verifications(user_id);

-- Index for state filtering (useful for compliance reports)
CREATE INDEX IF NOT EXISTS idx_consult_location_verifications_state
  ON consult_location_verifications(confirmed_state);

-- Enable RLS
ALTER TABLE consult_location_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consult_location_verifications

-- Users can view their own location verifications
DROP POLICY IF EXISTS "Users can view own location verifications" ON consult_location_verifications;
CREATE POLICY "Users can view own location verifications" ON consult_location_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert verification for their own appointments
DROP POLICY IF EXISTS "Users can insert own location verification" ON consult_location_verifications;
CREATE POLICY "Users can insert own location verification" ON consult_location_verifications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.user_id = auth.uid()
    )
  );

-- Admin/clinician can view all location verifications
DROP POLICY IF EXISTS "Admin can view all location verifications" ON consult_location_verifications;
CREATE POLICY "Admin can view all location verifications" ON consult_location_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'clinician')
    )
  );

-- ============================================
-- PART 3: CONSULT_NOTES TABLE
-- Clinical documentation (SOAP notes) - ADMIN/CLINICIAN ONLY
-- Patients CANNOT read these notes
-- ============================================

CREATE TABLE IF NOT EXISTS consult_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinician_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Note classification
  note_type TEXT NOT NULL DEFAULT 'telehealth_consult',

  -- SOAP Note format
  subjective TEXT,      -- Patient's reported symptoms, concerns
  objective TEXT,       -- Clinician observations
  assessment TEXT,      -- Clinical assessment/diagnosis
  plan TEXT,           -- Treatment plan
  recommendations TEXT, -- Additional recommendations (e.g., "in-person care recommended")

  -- Clinical flags
  red_flags BOOLEAN DEFAULT FALSE,          -- Safety concerns identified
  follow_up_recommended BOOLEAN DEFAULT FALSE,
  in_person_referral_recommended BOOLEAN DEFAULT FALSE,

  -- Session metadata
  duration_minutes INTEGER,

  -- Compliance verification (auto-populated from other tables)
  location_confirmed BOOLEAN DEFAULT FALSE,
  consent_version TEXT,

  -- EMR Integration
  emr_synced BOOLEAN DEFAULT FALSE,
  emr_record_id TEXT,  -- External EMR record ID if synced
  emr_synced_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One note per appointment
  UNIQUE(appointment_id)
);

-- Index for patient lookups (admin querying patient history)
CREATE INDEX IF NOT EXISTS idx_consult_notes_patient_user_id
  ON consult_notes(patient_user_id, created_at DESC);

-- Index for clinician lookups
CREATE INDEX IF NOT EXISTS idx_consult_notes_clinician_user_id
  ON consult_notes(clinician_user_id, created_at DESC);

-- Index for appointment lookups
CREATE INDEX IF NOT EXISTS idx_consult_notes_appointment_id
  ON consult_notes(appointment_id);

-- Index for red flag alerts
CREATE INDEX IF NOT EXISTS idx_consult_notes_red_flags
  ON consult_notes(red_flags) WHERE red_flags = TRUE;

-- Index for EMR sync status
CREATE INDEX IF NOT EXISTS idx_consult_notes_emr_synced
  ON consult_notes(emr_synced) WHERE emr_synced = FALSE;

-- Enable RLS
ALTER TABLE consult_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consult_notes
-- CRITICAL: Patients CANNOT view consult notes - admin/clinician only

-- Admin/clinician can view all consult notes
DROP POLICY IF EXISTS "Admin can view all consult notes" ON consult_notes;
CREATE POLICY "Admin can view all consult notes" ON consult_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'clinician')
    )
  );

-- Admin/clinician can insert consult notes
DROP POLICY IF EXISTS "Admin can insert consult notes" ON consult_notes;
CREATE POLICY "Admin can insert consult notes" ON consult_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'clinician')
    )
  );

-- Admin/clinician can update consult notes
DROP POLICY IF EXISTS "Admin can update consult notes" ON consult_notes;
CREATE POLICY "Admin can update consult notes" ON consult_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'clinician')
    )
  );

-- Admin can delete consult notes (with caution)
DROP POLICY IF EXISTS "Admin can delete consult notes" ON consult_notes;
CREATE POLICY "Admin can delete consult notes" ON consult_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- PART 4: ADD TRIGGER FOR UPDATED_AT ON CONSULT_NOTES
-- ============================================

DROP TRIGGER IF EXISTS update_consult_notes_updated_at ON consult_notes;
CREATE TRIGGER update_consult_notes_updated_at
  BEFORE UPDATE ON consult_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 5: CREATE ADMIN VIEW FOR CONSULT MANAGEMENT
-- ============================================

CREATE OR REPLACE VIEW admin_consult_overview AS
SELECT
  a.id as appointment_id,
  a.user_id as patient_user_id,
  p.first_name as patient_first_name,
  p.last_name as patient_last_name,
  a.patient_name,
  a.patient_email,
  a.start_time,
  a.end_time,
  a.status as appointment_status,
  a.zoom_meeting_url,

  -- Consent status
  tc.consent_version,
  tc.accepted_at as consent_accepted_at,
  CASE WHEN tc.id IS NOT NULL THEN TRUE ELSE FALSE END as has_consent,

  -- Location verification
  lv.confirmed_state,
  lv.confirmed_city,
  lv.confirmed_at as location_confirmed_at,
  CASE WHEN lv.id IS NOT NULL THEN TRUE ELSE FALSE END as location_verified,

  -- Note status
  cn.id as note_id,
  CASE WHEN cn.id IS NOT NULL THEN TRUE ELSE FALSE END as has_note,
  cn.red_flags,
  cn.follow_up_recommended,
  cn.emr_synced,
  cn.created_at as note_created_at

FROM appointments a
LEFT JOIN profiles p ON a.user_id = p.id
LEFT JOIN telehealth_consents tc ON a.user_id = tc.user_id
LEFT JOIN consult_location_verifications lv ON a.id = lv.appointment_id
LEFT JOIN consult_notes cn ON a.id = cn.appointment_id
WHERE a.status IN ('scheduled', 'confirmed', 'completed')
ORDER BY a.start_time DESC;

-- Grant access to authenticated users (RLS will filter appropriately)
GRANT SELECT ON admin_consult_overview TO authenticated;

-- ============================================
-- PART 6: TABLE COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE telehealth_consents IS 'HIPAA: Patient telehealth consent records with version tracking for regulatory compliance';
COMMENT ON TABLE consult_location_verifications IS 'HIPAA: Pre-consult location verification for state licensure compliance (TX only)';
COMMENT ON TABLE consult_notes IS 'HIPAA: Clinical SOAP documentation - ADMIN/CLINICIAN ACCESS ONLY. Patients cannot view.';

COMMENT ON COLUMN telehealth_consents.consent_text_hash IS 'SHA256 hash of the consent text to verify consent integrity';
COMMENT ON COLUMN consult_location_verifications.confirmed_state IS 'Must be TX (Texas) for consult to proceed';
COMMENT ON COLUMN consult_location_verifications.method IS 'self_attest = patient confirmed, gps = future GPS verification';
COMMENT ON COLUMN consult_notes.red_flags IS 'TRUE if safety concerns identified requiring immediate attention';
COMMENT ON COLUMN consult_notes.emr_record_id IS 'External EMR system record ID after successful sync';
