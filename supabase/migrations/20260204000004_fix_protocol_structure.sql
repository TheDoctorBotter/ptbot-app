-- Migration: Fix protocol structure for exercises and branding
-- Date: 2026-02-04
-- Purpose: Add missing columns, fix relationships, enable protocol exercises to load

-- ============================================
-- PART 1: ADD MISSING COLUMNS TO protocol_phases
-- ============================================

ALTER TABLE protocol_phases ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE protocol_phases ADD COLUMN IF NOT EXISTS week_start INT DEFAULT 0;
ALTER TABLE protocol_phases ADD COLUMN IF NOT EXISTS week_end INT;

-- Rename phase_name to name for consistency (if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'protocol_phases' AND column_name = 'phase_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'protocol_phases' AND column_name = 'name'
  ) THEN
    ALTER TABLE protocol_phases RENAME COLUMN phase_name TO name;
  END IF;
END $$;

-- ============================================
-- PART 2: ADD name COLUMN TO protocols
-- ============================================

ALTER TABLE protocols ADD COLUMN IF NOT EXISTS name TEXT;

-- Update name from surgery_name
UPDATE protocols SET name = surgery_name WHERE name IS NULL;

-- ============================================
-- PART 3: FIX phase_routines TABLE STRUCTURE
-- ============================================

-- Add protocol_key and phase_number columns for easier querying
ALTER TABLE phase_routines ADD COLUMN IF NOT EXISTS protocol_key TEXT;
ALTER TABLE phase_routines ADD COLUMN IF NOT EXISTS phase_number INT;

-- Create index for these columns
CREATE INDEX IF NOT EXISTS idx_phase_routines_protocol_phase ON phase_routines(protocol_key, phase_number);

-- Rename exercise_routine_id to routine_id if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_routines' AND column_name = 'exercise_routine_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_routines' AND column_name = 'routine_id'
  ) THEN
    ALTER TABLE phase_routines RENAME COLUMN exercise_routine_id TO routine_id;
  END IF;
END $$;

-- ============================================
-- PART 4: UPDATE WEEK RANGES FOR PHASES
-- ============================================

-- Update TKA phases with week ranges
UPDATE protocol_phases pp SET
  week_start = CASE
    WHEN pp.phase_number = 1 THEN 0
    WHEN pp.phase_number = 2 THEN 2
    WHEN pp.phase_number = 3 THEN 6
    WHEN pp.phase_number = 4 THEN 12
    ELSE 0
  END,
  week_end = CASE
    WHEN pp.phase_number = 1 THEN 2
    WHEN pp.phase_number = 2 THEN 6
    WHEN pp.phase_number = 3 THEN 12
    WHEN pp.phase_number = 4 THEN NULL
    ELSE NULL
  END,
  description = CASE
    WHEN pp.phase_number = 1 THEN 'Focus on pain management, swelling control, and gentle range of motion exercises'
    WHEN pp.phase_number = 2 THEN 'Progressively increase range of motion and begin strengthening exercises'
    WHEN pp.phase_number = 3 THEN 'Advanced strengthening and functional training for daily activities'
    WHEN pp.phase_number = 4 THEN 'Return to full function and higher level activities'
    ELSE NULL
  END
FROM protocols p
WHERE pp.protocol_id = p.id AND p.protocol_key = 'knee_total_knee_arthroplasty';

-- Update ACL phases with week ranges
UPDATE protocol_phases pp SET
  week_start = CASE
    WHEN pp.phase_number = 1 THEN 0
    WHEN pp.phase_number = 2 THEN 4
    WHEN pp.phase_number = 3 THEN 12
    WHEN pp.phase_number = 4 THEN 24
    ELSE 0
  END,
  week_end = CASE
    WHEN pp.phase_number = 1 THEN 4
    WHEN pp.phase_number = 2 THEN 12
    WHEN pp.phase_number = 3 THEN 24
    WHEN pp.phase_number = 4 THEN NULL
    ELSE NULL
  END
FROM protocols p
WHERE pp.protocol_id = p.id AND p.protocol_key = 'knee_acl_reconstruction';

-- Update THA Posterior phases with week ranges
UPDATE protocol_phases pp SET
  week_start = CASE
    WHEN pp.phase_number = 1 THEN 0
    WHEN pp.phase_number = 2 THEN 2
    WHEN pp.phase_number = 3 THEN 6
    WHEN pp.phase_number = 4 THEN 12
    ELSE 0
  END,
  week_end = CASE
    WHEN pp.phase_number = 1 THEN 2
    WHEN pp.phase_number = 2 THEN 6
    WHEN pp.phase_number = 3 THEN 12
    WHEN pp.phase_number = 4 THEN NULL
    ELSE NULL
  END
FROM protocols p
WHERE pp.protocol_id = p.id AND p.protocol_key = 'hip_total_hip_arthroplasty_posterior';

-- Update THA Anterior phases
UPDATE protocol_phases pp SET
  week_start = CASE
    WHEN pp.phase_number = 1 THEN 0
    WHEN pp.phase_number = 2 THEN 2
    WHEN pp.phase_number = 3 THEN 6
    WHEN pp.phase_number = 4 THEN 12
    ELSE 0
  END,
  week_end = CASE
    WHEN pp.phase_number = 1 THEN 2
    WHEN pp.phase_number = 2 THEN 6
    WHEN pp.phase_number = 3 THEN 12
    WHEN pp.phase_number = 4 THEN NULL
    ELSE NULL
  END
FROM protocols p
WHERE pp.protocol_id = p.id AND p.protocol_key = 'hip_total_hip_arthroplasty_anterior';

-- Set default week ranges for all other protocols (generic 4-phase)
UPDATE protocol_phases pp SET
  week_start = CASE
    WHEN pp.phase_number = 1 THEN 0
    WHEN pp.phase_number = 2 THEN 3
    WHEN pp.phase_number = 3 THEN 6
    WHEN pp.phase_number = 4 THEN 12
    WHEN pp.phase_number = 5 THEN 16
    ELSE 0
  END,
  week_end = CASE
    WHEN pp.phase_number = 1 THEN 3
    WHEN pp.phase_number = 2 THEN 6
    WHEN pp.phase_number = 3 THEN 12
    WHEN pp.phase_number = 4 THEN 16
    WHEN pp.phase_number = 5 THEN NULL
    ELSE NULL
  END
WHERE week_start IS NULL OR week_start = 0;

-- ============================================
-- PART 5: ENABLE RLS POLICIES FOR PROTOCOLS
-- ============================================

-- Enable RLS on protocols table
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

-- Everyone can view active protocols
DROP POLICY IF EXISTS "Anyone can view active protocols" ON protocols;
CREATE POLICY "Anyone can view active protocols" ON protocols
  FOR SELECT USING (is_active = true);

-- Enable RLS on protocol_phases
ALTER TABLE protocol_phases ENABLE ROW LEVEL SECURITY;

-- Everyone can view protocol phases
DROP POLICY IF EXISTS "Anyone can view protocol phases" ON protocol_phases;
CREATE POLICY "Anyone can view protocol phases" ON protocol_phases
  FOR SELECT USING (true);

-- ============================================
-- PART 6: GRANT ACCESS
-- ============================================

GRANT SELECT ON protocols TO authenticated;
GRANT SELECT ON protocols TO anon;
GRANT SELECT ON protocol_phases TO authenticated;
GRANT SELECT ON protocol_phases TO anon;
