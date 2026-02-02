-- Migration: Add email and phone to assessments table
-- Date: 2026-02-02

-- Add email and phone columns to assessments
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS user_phone TEXT;

-- Add consent fields
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS consent_contact BOOLEAN DEFAULT false;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS consent_data_use BOOLEAN DEFAULT false;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS legal_waiver_accepted BOOLEAN DEFAULT false;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ;

-- Update the admin view to include new fields
DROP VIEW IF EXISTS admin_assessments;

CREATE OR REPLACE VIEW admin_assessments AS
SELECT
  a.id,
  a.user_id,
  a.user_email,
  a.user_phone,
  u.email as auth_email,
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
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;
