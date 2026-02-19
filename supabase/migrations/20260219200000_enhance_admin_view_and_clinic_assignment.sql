-- ============================================
-- MIGRATION: Enhance admin view and auto-assign patients to clinic
-- ============================================

-- ============================================
-- PART 1: Update admin_consult_overview to include patient_phone
-- ============================================

CREATE OR REPLACE VIEW admin_consult_overview AS
SELECT
  a.id as appointment_id,
  a.user_id as patient_user_id,
  p.first_name as patient_first_name,
  p.last_name as patient_last_name,
  a.patient_name,
  a.patient_email,
  a.patient_phone,
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
ORDER BY a.start_time DESC;

-- Grant access to authenticated users (RLS will filter appropriately)
GRANT SELECT ON admin_consult_overview TO authenticated;

-- ============================================
-- PART 2: Auto-assign patient to clinic when they book an appointment
-- ============================================

-- Function: when a logged-in user books an appointment, assign them to the clinic
CREATE OR REPLACE FUNCTION assign_patient_to_clinic_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- Only act when user_id is present (logged-in patient)
  IF NEW.user_id IS NOT NULL THEN
    -- Get the primary clinic (first one created)
    SELECT id INTO v_clinic_id
    FROM clinics
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_clinic_id IS NOT NULL THEN
      -- Assign clinic_id and ensure role is 'patient' if not already set to clinician/admin
      UPDATE profiles
      SET
        clinic_id = COALESCE(clinic_id, v_clinic_id),
        role = CASE WHEN role IN ('clinician', 'admin') THEN role ELSE 'patient' END,
        updated_at = NOW()
      WHERE id = NEW.user_id
        AND (clinic_id IS NULL);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists, then recreate
DROP TRIGGER IF EXISTS trigger_assign_patient_on_booking ON appointments;

CREATE TRIGGER trigger_assign_patient_on_booking
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION assign_patient_to_clinic_on_booking();

-- ============================================
-- PART 3: Backfill - assign existing appointment users to the clinic
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics ORDER BY created_at ASC LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    UPDATE profiles p
    SET
      clinic_id = v_clinic_id,
      role = CASE WHEN p.role IN ('clinician', 'admin') THEN p.role ELSE 'patient' END,
      updated_at = NOW()
    FROM appointments a
    WHERE a.user_id = p.id
      AND p.clinic_id IS NULL
      AND p.role NOT IN ('clinician', 'admin');
  END IF;
END $$;

-- ============================================
-- PART 4: Helper view for total patient count (includes appointment guests)
-- ============================================

-- Drop and recreate patient_count_summary for the dashboard
CREATE OR REPLACE VIEW clinic_patient_count AS
SELECT
  c.id as clinic_id,
  -- Registered patients assigned to clinic
  COUNT(DISTINCT p.id) FILTER (WHERE p.clinic_id = c.id AND p.role = 'patient') as registered_patients,
  -- Guest appointment patients (no user_id, unique by email)
  COUNT(DISTINCT a.patient_email) FILTER (WHERE a.user_id IS NULL AND a.patient_email IS NOT NULL) as guest_patients,
  -- Total unique appointments (logged-in + guest)
  COUNT(DISTINCT COALESCE(a.user_id::text, a.patient_email)) FILTER (WHERE a.id IS NOT NULL) as total_appointment_patients
FROM clinics c
LEFT JOIN profiles p ON p.clinic_id = c.id AND p.role = 'patient'
LEFT JOIN appointments a ON TRUE
GROUP BY c.id;

GRANT SELECT ON clinic_patient_count TO authenticated;
