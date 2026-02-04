-- Migration: Marketable Bundle Features
-- Date: 2026-02-04
-- Purpose: Add clinic branding, precautions, plan sharing, and phase-routine mapping

-- ============================================
-- PART 1: CLINIC BRANDING COLUMNS
-- ============================================

-- Add branding columns to clinics table
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0EA5E9';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#6366F1';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Comment on columns
COMMENT ON COLUMN clinics.logo_url IS 'URL to clinic logo stored in Supabase Storage';
COMMENT ON COLUMN clinics.primary_color IS 'Primary brand color (hex)';
COMMENT ON COLUMN clinics.secondary_color IS 'Secondary brand color (hex)';
COMMENT ON COLUMN clinics.tagline IS 'Optional clinic tagline for patient-facing screens';

-- ============================================
-- PART 2: PRECAUTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS precautions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_key TEXT NOT NULL,
  phase_number INT,
  title TEXT NOT NULL,
  bullets TEXT[] NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning')),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for precautions queries
CREATE INDEX IF NOT EXISTS idx_precautions_protocol_key ON precautions(protocol_key);
CREATE INDEX IF NOT EXISTS idx_precautions_phase ON precautions(protocol_key, phase_number);

-- Enable RLS
ALTER TABLE precautions ENABLE ROW LEVEL SECURITY;

-- Everyone can view precautions (read-only safety info)
DROP POLICY IF EXISTS "Anyone can view precautions" ON precautions;
CREATE POLICY "Anyone can view precautions" ON precautions
  FOR SELECT USING (true);

-- Seed precautions data
INSERT INTO precautions (protocol_key, phase_number, title, bullets, severity, display_order)
VALUES
  -- Posterior THA precautions (all phases)
  ('hip_total_hip_arthroplasty_posterior', NULL, 'Posterior Hip Precautions',
   ARRAY[
     'Do NOT bend your hip past 90 degrees',
     'Do NOT cross your legs or ankles',
     'Do NOT rotate your hip inward (pigeon-toe)',
     'Use a raised toilet seat and shower chair',
     'Sleep with a pillow between your legs',
     'When sitting, keep knees lower than hips'
   ], 'warning', 1),

  -- Anterior THA cautions
  ('hip_total_hip_arthroplasty_anterior', NULL, 'Anterior Hip Cautions',
   ARRAY[
     'Avoid extreme hip extension (reaching leg behind you)',
     'Avoid combined external rotation with extension',
     'Use caution with stairs - lead with surgical leg going up',
     'Sleep on your back or non-surgical side initially'
   ], 'info', 1),

  -- ACL reconstruction precautions
  ('knee_acl_reconstruction', 1, 'Phase 1 ACL Precautions',
   ARRAY[
     'Wear your brace as prescribed when walking',
     'Use crutches until cleared by your surgeon',
     'Avoid pivoting or twisting on your surgical leg',
     'Ice 15-20 minutes after exercises'
   ], 'warning', 1),

  ('knee_acl_reconstruction', 2, 'Phase 2 ACL Guidelines',
   ARRAY[
     'Continue wearing brace for outdoor activities',
     'No running, jumping, or cutting movements yet',
     'Progress weight bearing as tolerated'
   ], 'info', 1),

  -- Rotator cuff repair precautions
  ('shoulder_rotator_cuff_repair_grade1', 1, 'Phase 1 Rotator Cuff Precautions',
   ARRAY[
     'Wear your sling as prescribed',
     'No active shoulder movement - only passive motion allowed',
     'Support your arm when removing sling for exercises',
     'Sleep in recliner or propped up initially'
   ], 'warning', 1),

  ('shoulder_rotator_cuff_repair_grade2', 1, 'Phase 1 Rotator Cuff Precautions (Medium Tear)',
   ARRAY[
     'Wear your sling at all times except for exercises',
     'No active shoulder movement for 6 weeks',
     'No lifting, pushing, or pulling with surgical arm',
     'Sleep in sling or in recliner'
   ], 'warning', 1),

  ('shoulder_rotator_cuff_repair_grade3', 1, 'Phase 1 Rotator Cuff Precautions (Large Tear)',
   ARRAY[
     'Extended immobilization - sling at all times',
     'No active movement for 6-8 weeks',
     'Passive motion only as directed by therapist',
     'Higher healing time - patience is critical'
   ], 'warning', 1),

  -- Total knee precautions
  ('knee_total_knee_arthroplasty', 1, 'Phase 1 TKA Guidelines',
   ARRAY[
     'Use walker or crutches as prescribed',
     'Ice and elevate to control swelling',
     'Perform ankle pumps frequently to prevent blood clots',
     'Take blood thinners as prescribed'
   ], 'info', 1),

  -- Meniscus repair precautions
  ('knee_meniscus_repair', 1, 'Phase 1 Meniscus Repair Precautions',
   ARRAY[
     'Partial or non-weight bearing as prescribed',
     'Wear brace locked in extension for walking',
     'No deep squatting or pivoting',
     'Limit flexion as directed by surgeon'
   ], 'warning', 1),

  -- Achilles tendon repair
  ('foot_ankle_achilles_tendon_repair', 1, 'Phase 1 Achilles Precautions',
   ARRAY[
     'Non-weight bearing in boot initially',
     'Keep boot on at all times, including sleep',
     'No stretching of the calf/Achilles',
     'Elevate foot above heart when resting'
   ], 'warning', 1),

  -- Generic post-op reminder
  ('_generic_postop', NULL, 'General Post-Operative Guidelines',
   ARRAY[
     'Follow your surgeon''s specific instructions',
     'Attend all follow-up appointments',
     'Report increased pain, swelling, redness, or fever immediately',
     'Take medications as prescribed',
     'Stay hydrated and maintain good nutrition for healing'
   ], 'info', 99)

ON CONFLICT DO NOTHING;

COMMENT ON TABLE precautions IS 'Protocol-specific safety precautions and reminders for patients';

-- ============================================
-- PART 3: PLAN SHARES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS plan_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for token lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_shares_token ON plan_shares(token);
CREATE INDEX IF NOT EXISTS idx_plan_shares_user_id ON plan_shares(user_id);

-- Enable RLS
ALTER TABLE plan_shares ENABLE ROW LEVEL SECURITY;

-- Users can create their own shares
DROP POLICY IF EXISTS "Users can create own shares" ON plan_shares;
CREATE POLICY "Users can create own shares" ON plan_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own shares
DROP POLICY IF EXISTS "Users can view own shares" ON plan_shares;
CREATE POLICY "Users can view own shares" ON plan_shares
  FOR SELECT USING (auth.uid() = user_id);

-- Public access via token (for shared links) - handled by service role or anon with token
DROP POLICY IF EXISTS "Public can view by token" ON plan_shares;
CREATE POLICY "Public can view by token" ON plan_shares
  FOR SELECT USING (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_plan_share_views(share_token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE plan_shares
  SET view_count = view_count + 1
  WHERE token = share_token
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE plan_shares IS 'Shareable plan links with clinic branding and exercise details';

-- ============================================
-- PART 4: PHASE ROUTINES MAPPING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS phase_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_phase_id UUID NOT NULL REFERENCES protocol_phases(id) ON DELETE CASCADE,
  exercise_routine_id UUID NOT NULL REFERENCES exercise_routines(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(protocol_phase_id, exercise_routine_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phase_routines_phase ON phase_routines(protocol_phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_routines_routine ON phase_routines(exercise_routine_id);

-- Enable RLS
ALTER TABLE phase_routines ENABLE ROW LEVEL SECURITY;

-- Anyone can view phase routines
DROP POLICY IF EXISTS "Anyone can view phase routines" ON phase_routines;
CREATE POLICY "Anyone can view phase routines" ON phase_routines
  FOR SELECT USING (true);

COMMENT ON TABLE phase_routines IS 'Maps protocol phases to recommended exercise routines';

-- ============================================
-- PART 5: ADD PLAN_SHARED EVENT TYPE
-- ============================================

-- Update activity_events constraint to include plan_shared
ALTER TABLE activity_events DROP CONSTRAINT IF EXISTS activity_events_type_check;
ALTER TABLE activity_events ADD CONSTRAINT activity_events_type_check
  CHECK (event_type IN (
    'assessment_completed',
    'assessment_started',
    'routine_opened',
    'video_opened',
    'video_completed',
    'phase_changed',
    'exercise_favorited',
    'session_started',
    'plan_shared'
  ));

-- ============================================
-- PART 6: HELPER FUNCTIONS
-- ============================================

-- Function to get precautions for a protocol/phase
CREATE OR REPLACE FUNCTION get_precautions(p_protocol_key TEXT, p_phase_number INT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  bullets TEXT[],
  severity TEXT,
  display_order INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.title,
    pr.bullets,
    pr.severity,
    pr.display_order
  FROM precautions pr
  WHERE pr.is_active = true
    AND (
      -- Match specific protocol
      (pr.protocol_key = p_protocol_key AND (pr.phase_number IS NULL OR pr.phase_number = p_phase_number))
      OR
      -- Also include generic post-op for any post-op patient
      (pr.protocol_key = '_generic_postop')
    )
  ORDER BY pr.display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..24 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 7: UPDATE CLINICS RLS FOR UPDATES
-- ============================================

-- Allow clinicians to update their clinic's branding
DROP POLICY IF EXISTS "Clinicians can update own clinic" ON clinics;
CREATE POLICY "Clinicians can update own clinic" ON clinics
  FOR UPDATE USING (
    id IN (
      SELECT clinic_id FROM profiles
      WHERE id = auth.uid() AND role IN ('clinician', 'admin')
    )
  );
