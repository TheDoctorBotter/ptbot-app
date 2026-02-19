-- ============================================
-- MIGRATION: Auto-assign new users to the default clinic on profile creation
-- ============================================
-- When a patient signs up (profile row is inserted), automatically assign
-- them to the primary clinic so they appear in the clinic dashboard.

CREATE OR REPLACE FUNCTION assign_new_user_to_clinic()
RETURNS TRIGGER AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- Only assign if no clinic_id yet and not already a clinician/admin
  IF NEW.clinic_id IS NULL AND NEW.role NOT IN ('clinician', 'admin') THEN
    -- Get the primary clinic (earliest created)
    SELECT id INTO v_clinic_id
    FROM clinics
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_clinic_id IS NOT NULL THEN
      NEW.clinic_id := v_clinic_id;
      -- Ensure role defaults to 'patient' if not set
      IF NEW.role IS NULL OR NEW.role = '' THEN
        NEW.role := 'patient';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists, recreate
DROP TRIGGER IF EXISTS trigger_assign_clinic_on_profile_create ON profiles;

CREATE TRIGGER trigger_assign_clinic_on_profile_create
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_new_user_to_clinic();

-- ============================================
-- Backfill: assign any existing users without clinic_id
-- ============================================
DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics ORDER BY created_at ASC LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    UPDATE profiles
    SET
      clinic_id = v_clinic_id,
      role = COALESCE(NULLIF(role, ''), 'patient'),
      updated_at = NOW()
    WHERE clinic_id IS NULL
      AND role NOT IN ('clinician', 'admin');
  END IF;
END $$;
