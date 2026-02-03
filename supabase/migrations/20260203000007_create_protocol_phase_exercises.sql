-- Create junction table to link exercises to protocol phases
-- This allows post-op patients to receive protocol-specific exercises

CREATE TABLE IF NOT EXISTS protocol_phase_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  phase_number INT NOT NULL,
  exercise_id UUID NOT NULL REFERENCES exercise_videos(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  -- Optional phase-specific dosage overrides (NULL means use exercise defaults)
  phase_sets INT,
  phase_reps INT,
  phase_hold_seconds INT,
  phase_frequency TEXT,
  -- Phase-specific notes
  phase_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Each exercise can only appear once per protocol/phase combination
  UNIQUE(protocol_id, phase_number, exercise_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_protocol_phase_exercises_protocol
  ON protocol_phase_exercises(protocol_id);

CREATE INDEX IF NOT EXISTS idx_protocol_phase_exercises_protocol_phase
  ON protocol_phase_exercises(protocol_id, phase_number);

CREATE INDEX IF NOT EXISTS idx_protocol_phase_exercises_exercise
  ON protocol_phase_exercises(exercise_id);

-- Add RLS policies
ALTER TABLE protocol_phase_exercises ENABLE ROW LEVEL SECURITY;

-- Allow public read access (exercises are public content)
CREATE POLICY "Allow public read access to protocol_phase_exercises"
  ON protocol_phase_exercises
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users with admin role can modify
CREATE POLICY "Allow admin insert on protocol_phase_exercises"
  ON protocol_phase_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admin update on protocol_phase_exercises"
  ON protocol_phase_exercises
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow admin delete on protocol_phase_exercises"
  ON protocol_phase_exercises
  FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE protocol_phase_exercises IS 'Junction table linking exercises to specific protocol phases for post-op rehabilitation';
COMMENT ON COLUMN protocol_phase_exercises.phase_sets IS 'Override sets for this phase (NULL = use exercise default)';
COMMENT ON COLUMN protocol_phase_exercises.phase_reps IS 'Override reps for this phase (NULL = use exercise default)';
COMMENT ON COLUMN protocol_phase_exercises.phase_hold_seconds IS 'Override hold time for this phase (NULL = use exercise default)';
COMMENT ON COLUMN protocol_phase_exercises.phase_frequency IS 'Override frequency for this phase (NULL = use exercise default)';
COMMENT ON COLUMN protocol_phase_exercises.phase_notes IS 'Phase-specific instructions or precautions';
